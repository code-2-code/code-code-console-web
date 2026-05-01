# Agent Rules

- This repository owns the React console app, showcase web app, feature
  packages, and shared console UI package.
- Do not edit protobuf source or generated contract bindings here.
- If UI work needs a new public contract, change `code-code-contracts` first
  and then update this repository to the released contract version.
- Keep console BFF, showcase API, platform runtime, and deployment behavior out
  of this repository.
- Keep UI changes scoped to the relevant package under
  `packages/console-web`.
