import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProvidersPage } from "./providers";
import { mutateProviderObservability, probeAllProviderObservability, probeProviderModelCatalog } from "../domains/providers/api";
import { useProviders } from "../domains/providers/reference-data";
import { ProviderEndpointType } from "@code-code/agent-contract/provider/v1";
import { ProviderProtocol } from "../domains/providers/provider-protocol";

vi.mock("../domains/providers/reference-data", () => ({
  useProviders: vi.fn(),
}));
vi.mock("../domains/providers/api", async () => {
  const actual = await vi.importActual<typeof import("../domains/providers/api")>("../domains/providers/api");
  return {
    ...actual,
    mutateProviderObservability: vi.fn(),
    probeAllProviderObservability: vi.fn(),
    probeProviderModelCatalog: vi.fn(),
  };
});
vi.mock("@code-code/console-web-credential", () => ({
  mutateCredentials: vi.fn(),
  useProviderCLIs: () => ({
    clis: [],
    isLoading: false,
    isError: false,
    error: undefined,
    mutate: vi.fn(),
  }),
  useProductInfos: () => ({
    productInfos: [],
    isLoading: false,
    isError: false,
    error: undefined,
    mutate: vi.fn(),
  }),
  useProviderSurfaces: () => ({
    surfaces: [{
      surfaceId: "openai-compatible",
      productInfoId: "openai",
      modelCatalogProbeId: "openai-compatible",
      spec: {
        case: "api",
        value: { apiEndpoints: [{ baseUrl: "https://api.openai.com/v1", protocol: ProviderProtocol.OPENAI_COMPATIBLE }] },
      },
    }],
    isLoading: false,
    isError: false,
    error: undefined,
    mutate: vi.fn(),
  }),
  useProviderVendors: () => ({
    vendors: [],
    isLoading: false,
    isError: false,
    error: undefined,
    mutate: vi.fn(),
  }),
}));
vi.mock("../domains/providers/components/add-provider-dialog", () => ({
  AddProviderDialog: ({
    open,
    preferredOptionKind,
    onOpenChange,
    onConnected,
  }: {
    open: boolean;
    preferredOptionKind?: string;
    onOpenChange: (open: boolean) => void;
    onConnected: (provider: {
      providerId: string;
      displayName: string;
    }) => Promise<void> | void;
  }) => (open ? (
    <div>
      <div>dialog:{preferredOptionKind || "all-methods"}</div>
      <button type="button" onClick={() => onOpenChange(false)}>
        close-dialog
      </button>
      <button
        type="button"
        onClick={() => void onConnected({
          providerId: "provider-new",
          displayName: "MiniMax",
        })}
      >
        complete-connect
      </button>
    </div>
  ) : null),
}));
vi.mock("../domains/providers/components/provider-details-dialog", () => ({
  ProviderDetailsDialog: ({
    provider,
    onClose,
  }: {
    provider: { displayName: string } | null;
    onClose: () => void;
  }) => (provider ? (
    <div>
      <div>provider:{provider.displayName}</div>
      <button type="button" onClick={onClose}>close-provider</button>
    </div>
  ) : null),
}));
vi.mock("../domains/models/components/vendor-cell", () => ({
  VendorCell: ({ fallbackLabel }: { fallbackLabel: string }) => <span>{fallbackLabel}</span>,
}));

const useProvidersMock = vi.mocked(useProviders);
const probeAllProviderObservabilityMock = vi.mocked(probeAllProviderObservability);
const probeProviderModelCatalogMock = vi.mocked(probeProviderModelCatalog);
const mutateProviderObservabilityMock = vi.mocked(mutateProviderObservability);

const providerCatalogModel = { providerModelId: "gpt-4.1" };
const providerMock = {
  providerId: "provider-1",
  displayName: "OpenAI",
  providerCredentialId: "cred-1",
  surfaceId: "openai-compatible",
  endpoints: [{
    type: ProviderEndpointType.API,
    shape: {
      case: "api",
      value: {
        protocol: ProviderProtocol.OPENAI_COMPATIBLE,
        baseUrl: "https://api.openai.com/v1",
      },
    },
  }],
  models: [providerCatalogModel],
  status: {
    phase: 1,
  },
};

describe("ProvidersPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows direct connect actions and opens the scoped dialog", () => {
    mockProvidersPageState();

    renderProvidersPage();

    expect(screen.getAllByRole("button", { name: "Provider API Key" })).not.toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "Custom API Key" })).not.toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "CLI OAuth" })).not.toHaveLength(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Provider API Key" })[0]);

    expect(screen.getByText("dialog:surfaceApiKey")).toBeInTheDocument();
  });

  it("keeps empty state informational without duplicate add controls or helper text", () => {
    mockEmptyProvidersPageState();

    renderProvidersPage();

    expect(screen.queryByText("Connect with")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Provider API Key" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Custom API Key" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "CLI OAuth" })).toHaveLength(1);
    expect(screen.getByText("No providers.")).toBeInTheDocument();
  });

  it("filters providers by model and service search text", () => {
    mockProvidersPageState();

    renderProvidersPage();

    const search = screen.getByRole("textbox", { name: "Search providers" });
    fireEvent.change(search, { target: { value: "gpt-4.1" } });
    expect(screen.getByText("OpenAI")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "missing" } });
    expect(screen.getByText("No providers match this search.")).toBeInTheDocument();
  });

  it("opens the provider dialog from a credential deep link", () => {
    mockProvidersPageState();

    renderProvidersPage("/providers?credential=cred-1");

    expect(screen.getByText("provider:OpenAI")).toBeInTheDocument();
  });

  it("closes the provider dialog on first close click", () => {
    mockProvidersPageState();

    renderProvidersPage("/providers?credential=cred-1");

    expect(screen.getByText("provider:OpenAI")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "close-provider" }));
    expect(screen.queryByText("provider:OpenAI")).not.toBeInTheDocument();
  });

  it("closes the scoped add dialog on first close click", () => {
    mockProvidersPageState();

    renderProvidersPage("/providers?connectSession=session-1&connectKind=cliOAuth");

    expect(screen.getByText("dialog:cliOAuth")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "close-dialog" }));
    expect(screen.queryByText("dialog:cliOAuth")).not.toBeInTheDocument();
  });

  it("keeps the last successful provider list visible when refresh fails", () => {
    const mutate = vi.fn();
    useProvidersMock.mockReturnValue({
      providers: [providerMock],
    isLoading: false,
    isError: true,
    mutate,
    upsertProvider: vi.fn(),
  });

    renderProvidersPage();

    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.queryByText("Provider health degraded. Showing last successful provider list.")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed to load providers")).not.toBeInTheDocument();
  });

  it("triggers manual quota refresh from the page header", async () => {
    mockProvidersPageState();
    probeAllProviderObservabilityMock.mockResolvedValue({
      triggeredCount: 3,
      message: "workflow submitted: provider-observability-batch",
      results: [
        { outcome: "UNSPECIFIED", message: "workflow submitted: provider-observability-batch" },
      ],
    });
    mutateProviderObservabilityMock.mockResolvedValue(undefined);

    renderProvidersPage();

    fireEvent.click(screen.getByRole("button", { name: "Refresh quota" }));
    await screen.findByText("Quota refresh queued for 3 providers.");

    expect(probeAllProviderObservabilityMock).toHaveBeenCalledTimes(1);
    expect(mutateProviderObservabilityMock).toHaveBeenCalledTimes(1);
  });

  it("triggers a provider model catalog probe from the provider card", async () => {
    const mutate = vi.fn();
    useProvidersMock.mockReturnValue({
      providers: [providerMock],
      isLoading: false,
      isError: false,
      mutate,
      upsertProvider: vi.fn(),
    });
    probeProviderModelCatalogMock.mockResolvedValue({
      providerId: "provider-1",
      providerIds: ["provider-1"],
      message: "provider model catalog probe completed",
    });

    renderProvidersPage();

    fireEvent.click(screen.getByRole("button", { name: "Probe model catalog" }));

    await screen.findByText("provider model catalog probe completed");
    expect(probeProviderModelCatalogMock).toHaveBeenCalledWith("provider-1");
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("closes the add dialog without opening the provider dialog after connect success", async () => {
    mockProvidersPageState();

    renderProvidersPage();

    fireEvent.click(screen.getByRole("button", { name: "Provider API Key" }));
    expect(screen.getByText("dialog:surfaceApiKey")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "complete-connect" }));

    await waitFor(() => {
      expect(screen.queryByText("dialog:surfaceApiKey")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("provider:MiniMax")).not.toBeInTheDocument();
  });
});

function renderProvidersPage(initialEntry = "/providers") {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Theme>
        <Routes>
          <Route path="/providers" element={<ProvidersPage />} />
        </Routes>
      </Theme>
    </MemoryRouter>
  );
}

function mockProvidersPageState() {
  useProvidersMock.mockReturnValue({
    providers: [providerMock],
    isLoading: false,
    isError: false,
    mutate: vi.fn(),
    upsertProvider: vi.fn(),
  });
}

function mockEmptyProvidersPageState() {
  useProvidersMock.mockReturnValue({
    providers: [],
    isLoading: false,
    isError: false,
    mutate: vi.fn(),
    upsertProvider: vi.fn(),
  });
}
