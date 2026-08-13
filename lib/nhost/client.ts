const GRAPHQL_URL = process.env.NHOST_GRAPHQL_URL!;
const STORAGE_URL = process.env.NHOST_STORAGE_URL!;
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!;

export async function gql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors?.length) {
      return { data: null, error: json.errors[0].message };
    }

    return { data: json.data as T, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function storageUpload(
  file: Blob,
  filename: string
): Promise<{ id: string; url: string } | null> {
  const form = new FormData();
  form.append("file[]", file, filename);

  const res = await fetch(`${STORAGE_URL}/v1/files`, {
    method: "POST",
    headers: { "x-hasura-admin-secret": ADMIN_SECRET },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Nhost storage upload failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  const item = Array.isArray(json) ? json[0] : json;
  return { id: item.processedFiles?.[0]?.id ?? item.id, url: item.processedFiles?.[0]?.url ?? item.url };
}
