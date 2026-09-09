export type ForwardDriveWebhookResult =
  | { forwarded: true; status: number; error: null }
  | { forwarded: false; status: number | null; error: string };

export async function forwardDriveWebhookToN8n(input: {
  url: string | null;
  token: string | null;
  payload: unknown;
}): Promise<ForwardDriveWebhookResult> {
  if (!input.url) {
    return {
      forwarded: false,
      status: null,
      error: "n8n_webhook_url_not_configured"
    };
  }

  try {
    const response = await fetch(input.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(input.token ? { authorization: `Bearer ${input.token}` } : {})
      },
      body: JSON.stringify(input.payload)
    });

    if (!response.ok) {
      return {
        forwarded: false,
        status: response.status,
        error: `n8n_webhook_failed_${response.status}`
      };
    }

    return { forwarded: true, status: response.status, error: null };
  } catch (error) {
    return {
      forwarded: false,
      status: null,
      error: error instanceof Error ? error.message : "n8n_webhook_failed"
    };
  }
}
