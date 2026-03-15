# SWC-106 Mermaid Diagrams

Use these in Mermaid-compatible tools (GitHub, Notion, etc.) or [mermaid.live](https://mermaid.live).

## Attack Flow (Vulnerable)

```mermaid
flowchart TB
    subgraph Vulnerable["⚠️ VULNERABLE - SWC-106"]
        User[User] -->|deposit ETH| Contract[Contract holds ETH]
        Attacker[Attacker] -->|destroy(attacker) NO CHECK| Contract
        Contract -->|selfdestruct| Attacker
        Attacker -->|Receives ALL ETH| Stolen[💰 ETH Stolen]
    end
```

## Secure Flow (Fixed)

```mermaid
flowchart TB
    subgraph Fixed["✅ FIXED - SWC-106 Remediated"]
        User[User] -->|deposit ETH| Contract[Contract holds ETH]
        Owner[Owner] -->|destroy(owner) onlyOwner ✓| Contract
        Contract -->|selfdestruct| Owner
        Attacker[Attacker] -->|destroy() attempt| Blocked[REVERT - Access Denied]
    end
```

## Sequence: Vulnerable vs Fixed

```mermaid
sequenceDiagram
    participant U as User
    participant C as Contract
    participant A as Attacker

    Note over U,A: VULNERABLE
    U->>C: deposit(1 ETH)
    A->>C: destroy(attackerAddress)
    C->>A: All ETH sent
    Note over C: Contract destroyed

    Note over U,A: FIXED
    U->>C: deposit(1 ETH)
    A->>C: destroy(attackerAddress)
    C->>A: REVERT (onlyOwner)
```

## Component: Access Control

```mermaid
flowchart LR
    subgraph Vulnerable
        V1[destroy] --> V2[No modifier]
        V2 --> V3[Anyone can call]
    end

    subgraph Fixed
        F1[destroy] --> F2[onlyOwner]
        F2 --> F3[Owner only]
    end
```
