import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CadenceSignup } from "@/components/shell/CadenceSignup";

/* Response shapes mirror the live worker's probed contract:
   201 {ok:true} new, 200 {ok:true, already:true} duplicate,
   422 {ok:false, error} rejection. */

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function fillAndSubmit(email: string) {
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText("Email address"));
  await user.type(screen.getByLabelText("Email address"), email);
  await user.click(screen.getByRole("button", { name: "SUBSCRIBE" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CadenceSignup", () => {
  it("posts {email, source: footer} and shows the success line on 201", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    render(<CadenceSignup />);

    await fillAndSubmit("reader@example.com");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://steady-cadence.shrey77-wrk.workers.dev/subscribe",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "reader@example.com", source: "footer" }),
      }),
    );
    expect(await screen.findByText("✓ You are on the list.")).toBeInTheDocument();
    // Success clears the field.
    expect(screen.getByLabelText("Email address")).toHaveValue("");
  });

  it("shows the duplicate line on 200 {already:true}", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { ok: true, already: true })),
    );
    render(<CadenceSignup />);

    await fillAndSubmit("reader@example.com");

    expect(await screen.findByText("Already on the list.")).toBeInTheDocument();
  });

  it("shows plain-words failure on a 422 and on a network error, without retrying", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(422, { ok: false, error: "invalid email" }))
      .mockRejectedValueOnce(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);
    render(<CadenceSignup />);

    await fillAndSubmit("reader@example.com");
    expect(
      await screen.findByText("That did not go through. Check the address and try once more."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1); // no automatic retry

    await fillAndSubmit("reader@example.com");
    expect(
      await screen.findByText("That did not go through. Check the address and try once more."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the status line as a permanently mounted polite live region", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<CadenceSignup />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
