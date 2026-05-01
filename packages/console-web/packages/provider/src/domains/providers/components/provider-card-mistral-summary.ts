import { normalizeMetricPercent, type ProviderOwnerObservabilityModel } from "../provider-owner-observability-model";
import { formatQuotaResetAtLocal } from "../provider-observability-time";
import {
  type ProviderQuotaCardRow,
  readQuotaSummaryWithObservedAt,
  resolveModelDescriptor,
} from "../provider-quota-metric-aggregation";
import { formatQuotaAmount } from "../provider-quota-presentation";

export type MistralUsageSummary = {
  updatedAtLabel: string | null;
  updatedAtTimestamp?: string | null;
  rows: readonly MistralUsageRow[];
};

export type MistralUsageRow = {
  modelId: string;
  label: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
};

const mistralTokensMetric = "gen_ai.provider.usage.tokens.count";
const mistralCostMetric = "gen_ai.provider.usage.cost";
const mistralQuotaLimitMetric = "gen_ai.provider.quota.limit";
const mistralQuotaUsageMetric = "gen_ai.provider.quota.usage";
const mistralQuotaRemainingMetric = "gen_ai.provider.quota.remaining";
const mistralQuotaResetMetric = "gen_ai.provider.quota.reset.timestamp.seconds";

export type MistralQuotaSummary = {
  updatedAtLabel: string | null;
  updatedAtTimestamp?: string | null;
  rows: readonly ProviderQuotaCardRow[];
};

export type MistralUsageDetailsSummary = MistralQuotaSummary;

export function readMistralUsageSummary(
  observability: ProviderOwnerObservabilityModel | null,
  now: Date = new Date(),
  timeZone?: string,
): MistralUsageSummary | null {
  if (!observability) {
    return null;
  }
  const rowsByModel = new Map<string, MistralUsageRow>();
  appendMistralTokenRows(observability, rowsByModel, "input", (row, value) => {
    row.inputTokens = value;
  });
  appendMistralTokenRows(observability, rowsByModel, "output", (row, value) => {
    row.outputTokens = value;
  });
  appendMistralTokenRows(observability, rowsByModel, "cached", (row, value) => {
    row.cachedTokens = value;
  });

  const rows = Array.from(rowsByModel.values())
    .filter((row) => row.inputTokens !== null || row.outputTokens !== null || row.cachedTokens !== null)
    .sort((left, right) => mistralTokenTotal(right) - mistralTokenTotal(left));
  const summary = readQuotaSummaryWithObservedAt(rows, observability, now, timeZone);
  if (!summary) {
    return null;
  }
  return {
    rows: summary.rows,
    updatedAtLabel: summary.updatedAtLabel,
    updatedAtTimestamp: summary.updatedAtTimestamp,
  };
}

export function readMistralQuotaSummary(
  observability: ProviderOwnerObservabilityModel | null,
  now: Date = new Date(),
  timeZone?: string,
): MistralQuotaSummary | null {
  if (!observability) {
    return null;
  }
  const usageSummary = readMistralUsageSummary(observability, now, timeZone);
  const currency = readMistralCostCurrency(observability);
  const rows = [
    ...readMistralMonthlySpendRows(observability),
    ...readMistralBillingCapRows(observability, currency, now, timeZone),
  ];
  const summary = readQuotaSummaryWithObservedAt(rows, observability, now, timeZone);
  if (!summary) {
    return null;
  }
  return {
    rows: summary.rows,
    updatedAtLabel: summary.updatedAtLabel,
    updatedAtTimestamp: summary.updatedAtTimestamp,
  };
}

export function readMistralUsageDetailsSummary(
  observability: ProviderOwnerObservabilityModel | null,
  now: Date = new Date(),
  timeZone?: string,
): MistralUsageDetailsSummary | null {
  if (!observability) {
    return null;
  }
  const usageSummary = readMistralUsageSummary(observability, now, timeZone);
  const currency = readMistralCostCurrency(observability);
  const rows = [
    ...readMistralMonthlySpendRows(observability),
    ...readMistralBillingCapRows(observability, currency, now, timeZone),
    ...readMistralTokenSummaryRows(usageSummary),
    ...readMistralModelUsageRows(observability, usageSummary),
    ...readMistralModelTokenLimitRows(observability, usageSummary),
  ];
  const summary = readQuotaSummaryWithObservedAt(rows, observability, now, timeZone);
  if (!summary) {
    return null;
  }
  return {
    rows: summary.rows,
    updatedAtLabel: summary.updatedAtLabel,
    updatedAtTimestamp: summary.updatedAtTimestamp,
  };
}

function appendMistralTokenRows(
  observability: ProviderOwnerObservabilityModel,
  rowsByModel: Map<string, MistralUsageRow>,
  tokenType: string,
  assignValue: (row: MistralUsageRow, value: number) => void,
) {
  for (const metricRow of observability.metricRows(mistralTokensMetric, { token_type: tokenType })) {
    if (typeof metricRow.value !== "number") {
      continue;
    }
    const descriptor = resolveMistralModelDescriptor(metricRow.labels);
    const modelId = descriptor.id.trim();
    if (!modelId) {
      continue;
    }
    const row = rowsByModel.get(modelId) ?? {
      modelId,
      label: descriptor.label,
      inputTokens: null,
      outputTokens: null,
      cachedTokens: null,
    };
    assignValue(row, metricRow.value);
    rowsByModel.set(modelId, row);
  }
}

function mistralTokenTotal(row: MistralUsageRow) {
  return (row.inputTokens ?? 0) + (row.outputTokens ?? 0) + (row.cachedTokens ?? 0);
}

type MistralCurrency = {
  currency: string;
  symbol: string;
};

function readMistralMonthlySpendRows(observability: ProviderOwnerObservabilityModel): ProviderQuotaCardRow[] {
  const row = firstFiniteMetricRow(observability, mistralCostMetric, [
    { resource: "cost_usd", window: "month", scope: "total" },
    { resource: "cost", window: "month", scope: "total" },
  ]) ?? firstFiniteMetricRow(observability, mistralQuotaUsageMetric, mistralBillingCostLabelCandidates());
  if (!row || typeof row.value !== "number") {
    return [];
  }
  const currency = readMistralCurrency(row.labels);
  return [{
    id: "monthly-spend",
    label: "Monthly spend",
    value: row.value > 0 ? formatMistralCurrencyAmount(row.value, currency) : "No usage",
    progressUnavailableLabel: "this month",
  }];
}

function readMistralBillingCapRows(
  observability: ProviderOwnerObservabilityModel,
  currency: MistralCurrency,
  now: Date,
  timeZone?: string,
): ProviderQuotaCardRow[] {
  const limitRow = firstFiniteMetricRow(observability, mistralQuotaLimitMetric, mistralBillingCostLabelCandidates());
  const labels = limitRow?.labels;
  const limit = limitRow?.value ?? null;
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return [];
  }
  const remaining = metricValueForLabels(observability, mistralQuotaRemainingMetric, labels);
  const usage = metricValueForLabels(observability, mistralQuotaUsageMetric, labels);
  const resetAtSeconds = metricValueForLabels(observability, mistralQuotaResetMetric, labels);
  const resetAtLabel = typeof resetAtSeconds === "number" && resetAtSeconds > 0
    ? formatQuotaResetAtLocal(resetAtSeconds, now, timeZone)
    : null;
  const progressPercent = resolveMistralRemainingPercent(remaining, limit);
  const value = typeof remaining === "number"
    ? `${formatMistralCurrencyAmount(remaining, currency)} / ${formatMistralCurrencyAmount(limit, currency)}`
    : `${formatMistralCurrencyAmount(usage ?? 0, currency)} / ${formatMistralCurrencyAmount(limit, currency)}`;
  return [{
    id: "billing-cap",
    label: "Monthly billing cap",
    value,
    ...(resetAtLabel ? { resetAtLabel } : {}),
    ...(typeof progressPercent === "number" ? { progressPercent } : {}),
  }];
}

function readMistralTokenSummaryRows(summary: MistralUsageSummary | null): ProviderQuotaCardRow[] {
  if (!summary) {
    return [];
  }
  const totals = summary.rows.reduce(
    (next, row) => ({
      input: next.input + (row.inputTokens ?? 0),
      output: next.output + (row.outputTokens ?? 0),
      cached: next.cached + (row.cachedTokens ?? 0),
    }),
    { input: 0, output: 0, cached: 0 },
  );
  const total = totals.input + totals.output + totals.cached;
  if (total <= 0) {
    return [];
  }
  const parts = [
    `${formatQuotaAmount(totals.input)} input`,
    `${formatQuotaAmount(totals.output)} output`,
    ...(totals.cached > 0 ? [`${formatQuotaAmount(totals.cached)} cached`] : []),
  ];
  return [{
    id: "monthly-tokens",
    label: "Monthly tokens",
    value: formatQuotaAmount(total),
    progressUnavailableLabel: parts.join(" · "),
  }];
}

function readMistralModelUsageRows(
  observability: ProviderOwnerObservabilityModel,
  usageSummary: MistralUsageSummary | null,
): ProviderQuotaCardRow[] {
  const tokenRows = usageSummary?.rows ?? [];
  if (tokenRows.length === 0) {
    return [];
  }
  const limitsByModel = readMistralMonthlyTokenLimits(observability);
  const costsByModel = readMistralModelCosts(observability);
  return tokenRows.map((row) => {
    const total = mistralTokenTotal(row);
    const limit = limitsByModel.get(row.modelId);
    const cost = costsByModel.get(row.modelId);
    const tokenValue = limit ? `${formatQuotaAmount(total)} / ${formatQuotaAmount(limit.limit)}` : `${formatQuotaAmount(total)} tok`;
    return {
      id: `${row.modelId}-usage-detail`,
      label: row.label,
      value: cost ? `${formatMistralCurrencyAmount(cost.value, cost.currency)} · ${tokenValue}` : tokenValue,
      ...(limit ? { progressPercent: resolveMistralRemainingPercent(Math.max(0, limit.limit - total), limit.limit) } : {}),
      progressUnavailableLabel: formatMistralTokenBreakdown(row),
      subtle: true,
    };
  });
}

type MistralMonthlyTokenLimit = {
  limit: number;
};

type MistralTokenLimit = {
  minuteLimit: number | null;
  monthLimit: number | null;
};

type MistralModelCost = {
  value: number;
  currency: MistralCurrency;
};

function readMistralMonthlyTokenLimits(observability: ProviderOwnerObservabilityModel) {
  const limitsByModel = new Map<string, MistralMonthlyTokenLimit>();
  for (const [modelId, limit] of readMistralTokenLimitsByModel(observability)) {
    if (typeof limit.monthLimit !== "number" || limit.monthLimit <= 0) {
      continue;
    }
    limitsByModel.set(modelId, {
      limit: limit.monthLimit,
    });
  }
  return limitsByModel;
}

function readMistralModelTokenLimitRows(
  observability: ProviderOwnerObservabilityModel,
  usageSummary: MistralUsageSummary | null,
): ProviderQuotaCardRow[] {
  const usageByModel = readMistralMonthlyTokenUsageByModel(usageSummary);
  return Array.from(readMistralTokenLimitsByModel(observability))
    .filter(([, limit]) => limit.monthLimit || limit.minuteLimit)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([modelId, limit]) => {
      const usage = usageByModel.get(modelId) ?? 0;
      const remaining = limit.monthLimit ? Math.max(0, limit.monthLimit - usage) : null;
      const value = limit.monthLimit && remaining !== null
        ? `${formatQuotaAmount(remaining)} / ${formatQuotaAmount(limit.monthLimit)}`
        : "No monthly cap";
      const usedLabel = limit.monthLimit ? `${formatQuotaAmount(usage)} used` : null;
      const minuteLabel = limit.minuteLimit
        ? `${formatQuotaAmount(limit.minuteLimit)} / minute`
        : null;
      const hint = [usedLabel, minuteLabel].filter(Boolean).join(" · ") || null;
      return {
        id: `${modelId}-token-limit`,
        label: `${modelId} token limit`,
        value,
        ...(hint ? { progressUnavailableLabel: hint } : {}),
        ...(limit.monthLimit ? { progressPercent: resolveMistralRemainingPercent(remaining, limit.monthLimit) } : {}),
        subtle: true,
      };
    });
}

function readMistralMonthlyTokenUsageByModel(usageSummary: MistralUsageSummary | null) {
  const usageByModel = new Map<string, number>();
  for (const row of usageSummary?.rows ?? []) {
    usageByModel.set(row.modelId, mistralTokenTotal(row));
  }
  return usageByModel;
}

function readMistralTokenLimitsByModel(observability: ProviderOwnerObservabilityModel) {
  const limitsByModel = new Map<string, MistralTokenLimit>();
  for (const metricRow of observability.metricRows(mistralQuotaLimitMetric, { resource: "tokens" })) {
    if (typeof metricRow.value !== "number" || !Number.isFinite(metricRow.value) || metricRow.value <= 0) {
      continue;
    }
    const modelId = resolveMistralModelDescriptor(metricRow.labels).id.trim();
    if (!modelId) {
      continue;
    }
    const current = limitsByModel.get(modelId) ?? { minuteLimit: null, monthLimit: null };
    switch ((metricRow.labels?.window || "").trim()) {
      case "minute":
        current.minuteLimit = metricRow.value;
        break;
      case "month":
        current.monthLimit = metricRow.value;
        break;
      default:
        break;
    }
    limitsByModel.set(modelId, current);
  }
  return limitsByModel;
}

function readMistralModelCosts(observability: ProviderOwnerObservabilityModel) {
  const costsByModel = new Map<string, MistralModelCost>();
  for (const metricRow of [
    ...observability.metricRows(mistralCostMetric, { resource: "cost_usd", window: "month", scope: "model" }),
    ...observability.metricRows(mistralCostMetric, { resource: "cost", window: "month", scope: "model" }),
  ]) {
    if (typeof metricRow.value !== "number" || !Number.isFinite(metricRow.value) || metricRow.value <= 0) {
      continue;
    }
    const modelId = resolveMistralModelDescriptor(metricRow.labels).id.trim();
    if (!modelId) {
      continue;
    }
    costsByModel.set(modelId, {
      value: metricRow.value,
      currency: readMistralCurrency(metricRow.labels),
    });
  }
  return costsByModel;
}

function formatMistralTokenBreakdown(row: MistralUsageRow) {
  const parts = [
    `${formatQuotaAmount(row.inputTokens ?? 0)} input`,
    `${formatQuotaAmount(row.outputTokens ?? 0)} output`,
    ...(row.cachedTokens ? [`${formatQuotaAmount(row.cachedTokens)} cached`] : []),
  ];
  return parts.join(" · ");
}

function resolveMistralRemainingPercent(remaining: number | null, limit: number | null) {
  if (typeof remaining !== "number" || typeof limit !== "number" || limit <= 0) {
    return null;
  }
  if (!Number.isFinite(remaining) || !Number.isFinite(limit)) {
    return null;
  }
  return normalizeMetricPercent(remaining / limit * 100);
}

function readMistralCostCurrency(observability: ProviderOwnerObservabilityModel): MistralCurrency {
  const row = [
    ...observability.metricRows(mistralCostMetric, { resource: "cost_usd", window: "month" }),
    ...observability.metricRows(mistralCostMetric, { resource: "cost", window: "month" }),
    ...observability.metricRows(mistralQuotaLimitMetric, { resource: "cost_usd", window: "month" }),
    ...observability.metricRows(mistralQuotaLimitMetric, { resource: "cost", window: "month" }),
  ]
    .find((metricRow) => Boolean(
      metricRow.labels?.currency ||
      metricRow.labels?.currency_symbol ||
      mistralCurrencyFromResource(metricRow.labels?.resource).currency,
    ));
  return readMistralCurrency(row?.labels);
}

function readMistralCurrency(labels: Record<string, string> | undefined): MistralCurrency {
  const resourceCurrency = mistralCurrencyFromResource(labels?.resource);
  return {
    currency: (labels?.currency || resourceCurrency.currency || "USD").trim().toUpperCase(),
    symbol: (labels?.currency_symbol || resourceCurrency.symbol).trim(),
  };
}

function mistralBillingCostLabelCandidates() {
  return [
    { resource: "cost_usd", window: "month", quota_pool_id: "billing_cap" },
    { resource: "cost", window: "month", quota_pool_id: "billing_cap" },
  ];
}

function firstFiniteMetricRow(
  observability: ProviderOwnerObservabilityModel,
  metricName: string,
  labelCandidates: readonly Record<string, string>[],
) {
  for (const labels of labelCandidates) {
    const row = observability.metricRows(metricName, labels)
      .find((metricRow) => typeof metricRow.value === "number" && Number.isFinite(metricRow.value));
    if (row) {
      return row;
    }
  }
  return undefined;
}

function metricValueForLabels(
  observability: ProviderOwnerObservabilityModel,
  metricName: string,
  labels: Record<string, string> | undefined,
) {
  const expected = billingCostMatchLabels(labels);
  if (!expected) {
    return null;
  }
  return observability.metricValue(metricName, expected);
}

function billingCostMatchLabels(labels: Record<string, string> | undefined) {
  const resource = labels?.resource?.trim();
  const window = labels?.window?.trim();
  const quotaPoolId = labels?.quota_pool_id?.trim();
  if (!resource || !window || !quotaPoolId) {
    return null;
  }
  return { resource, window, quota_pool_id: quotaPoolId };
}

function mistralCurrencyFromResource(resource: string | undefined): MistralCurrency {
  const normalized = resource?.trim().toLowerCase() || "";
  if (normalized === "cost_usd") {
    return { currency: "USD", symbol: "$" };
  }
  if (normalized === "cost_eur") {
    return { currency: "EUR", symbol: "\u20ac" };
  }
  return { currency: "", symbol: "" };
}

function resolveMistralModelDescriptor(labels: Record<string, string> | undefined) {
  const descriptor = resolveModelDescriptor(labels, "Unknown");
  const split = splitMistralModelId(descriptor.id);
  const billingMetric = (
    labels?.mistral_ai_billing_metric ||
    labels?.["mistral_ai.billing_metric"] ||
    ""
  ).trim();
  const id = billingMetric || split.canonical || descriptor.id;
  const label = (
    labels?.model_label ||
    labels?.gen_ai_request_model ||
    labels?.["gen_ai.request.model"] ||
    split.display ||
    id
  ).trim() || id;
  return {
    id,
    label,
  };
}

function splitMistralModelId(modelId: string) {
  const [display = "", canonical = ""] = modelId.split("::", 2).map((part) => part.trim());
  if (!display || !canonical) {
    return { display: "", canonical: "" };
  }
  return { display, canonical };
}

function formatMistralCurrencyAmount(value: number, currency: MistralCurrency) {
  const absoluteValue = Math.abs(value);
  const amount = value.toLocaleString("en-US", {
    minimumFractionDigits: absoluteValue > 0 && absoluteValue < 1 ? 4 : 0,
    maximumFractionDigits: absoluteValue > 0 && absoluteValue < 10 ? 4 : 2,
  });
  if (currency.symbol) {
    return `${currency.symbol}${amount}`;
  }
  if (currency.currency) {
    return `${currency.currency} ${amount}`;
  }
  return amount;
}

function formatMistralUsageCategory(value: string) {
  switch (value.trim()) {
    case "completion":
      return "completion cost";
    case "ocr":
      return "OCR cost";
    case "connectors":
      return "connector cost";
    case "audio":
      return "audio cost";
    case "libraries_api.pages":
      return "library page cost";
    case "libraries_api.tokens":
      return "library token cost";
    case "fine_tuning.training":
      return "fine-tuning cost";
    case "fine_tuning.storage":
      return "fine-tuning storage";
    default:
      return "";
  }
}
