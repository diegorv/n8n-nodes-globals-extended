# <img src="nodes/GlobalConstants/globals-icon-60px.png" height="60" style="margin-bottom: -20px;"> n8n-nodes-globals

This is an n8n community node. It lets you create global constants that can be used in any workflow.

* [Installation](#installation)
* [Usage](#usage)
* [Node options](#node-options)
* [Error handling](#error-handling)
* [Version history](CHANGELOG.md)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Usage

Global constants are stored in an n8n Credential, which keeps them encrypted and reusable across all your workflows.

1. Add the **Global Constants** node to your workflow.
   ![Global Constants node](./docs/images/usage/1_select_node.png)

2. In the node configuration, select an existing credential or create a new one.

3. Choose the format for your constants:

   **Key-value pairs** — one `name=value` per line. Values containing `=` are supported.
   ![Define constants — key-value](./docs/images/usage/2_define_constants_string.png)

   **JSON** — a plain JSON object. Supports nested objects and arrays.
   ```json
   {
     "API_URL": "https://api.example.com",
     "RETRIES": 3,
     "HEADERS": { "X-Source": "n8n" }
   }
   ```
   ![Define constants — JSON](./docs/images/usage/2_define_constants_json.png)

4. Use the constants in your workflow.
   ![Use constants](./docs/images/usage/3_use_node.png)

## Node options

| Option | Default | Description |
|---|---|---|
| Put All Constants in One Key | `true` | Groups all constants under a single key in the output item |
| Constants Key Name | `constants` | The key name to use when the option above is enabled |

**Put All Constants in One Key: true** (default)

```json
{
  "constants": {
    "API_URL": "https://api.example.com",
    "RETRIES": 3
  }
}
```

**Put All Constants in One Key: false**

```json
{
  "API_URL": "https://api.example.com",
  "RETRIES": 3
}
```

If the node receives no input items, it creates a new item with the constants. If it receives input items, the constants are merged into each one.

## Secret Constants

Sensitive values (API tokens, passwords, private URLs) can be stored in the **Secret Constants** section of the credential. These fields are masked in the n8n credential editor — the values display as `••••••` and are never shown in plain text during configuration.

By default, secrets are **not included in the node output** and will never appear in execution logs. To use a secret in a downstream node, enable **Expose Secrets in Output** in the node settings.

| Option | Default | Description |
|---|---|---|
| Expose Secrets in Output | `false` | When enabled, secrets are merged into the output item |
| Secrets Key Name | `secrets` | The key under which secrets are grouped when exposed |

**Output when exposed:**

```json
{
  "constants": { "API_URL": "https://api.example.com" },
  "secrets": { "TOKEN": "••••••", "DB_PASSWORD": "••••••" }
}
```

> **Warning:** When _Expose Secrets in Output_ is enabled, secret values become part of the workflow item data and **will appear in n8n execution logs**. Only enable this when downstream nodes need to use the values directly, and ensure your n8n instance has appropriate access controls.

## Error handling

The node respects n8n's **Continue on Fail** setting. When enabled, any error (invalid credential, malformed JSON, etc.) produces an output item with an `error` field instead of halting the workflow.

> **Note:** The JSON format requires the credential value to be a plain object (`{}`). Arrays, primitives, and `null` are rejected with a descriptive error.
