import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { studentFixture } from "./fixtures";

const api = vi.hoisted(() => ({ getLearningV2Home: vi.fn(), getLearningV2Path: vi.fn(), getLearningV2State: vi.fn() }));
vi.mock("@/lib/server/guided-learning-api", () => api);
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("../review-launcher", () => ({ ReviewLauncher: ({ minutes }: { minutes: number }) => <main data-engine="guided-v1">Repaso v1: {minutes}</main> }));
import LearningReviewPage from "@/app/aprendizaje/repaso/page";

beforeEach(() => { vi.resetAllMocks(); api.getLearningV2Home.mockResolvedValue({ status: "not_found" }); });
describe("T032 review page dispatch", () => {
  it("preserves the original v1 launcher and duration", async () => {
    const html = renderToString(await LearningReviewPage({ searchParams: Promise.resolve({ minutos: "5" }) }));
    expect(html).toContain("guided-v1"); expect(html).toContain("5");
    expect(api.getLearningV2Path).not.toHaveBeenCalled();
  });
  it("links the active v2 route explicitly without replacing v1", async () => {
    const fixture = studentFixture("review");
    api.getLearningV2Home.mockResolvedValue({ status: "ready", value: fixture.home });
    const html = renderToString(await LearningReviewPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("motor=guided-v2&amp;ruta=practica-por-objetivos");
    expect(html).toContain("guided-v1");
  });
  it("loads the pinned v2 state and mounts maintenance", async () => {
    const fixture = studentFixture("review");
    api.getLearningV2Path.mockResolvedValue({ status: "ready", value: { path: fixture.path } });
    api.getLearningV2State.mockResolvedValue({ status: "ready", value: { state: fixture.state } });
    const html = renderToString(await LearningReviewPage({ searchParams: Promise.resolve({ motor: "guided-v2", ruta: fixture.path.slug }) }));
    expect(api.getLearningV2State).toHaveBeenCalledWith(fixture.path.enrollmentId);
    expect(html).toContain("Práctica y mantenimiento"); expect(html).not.toContain("guided-v1");
    expect(api.getLearningV2Home).not.toHaveBeenCalled();
  });
  it.each(["unauthorized", "forbidden", "not_found", "unavailable"])("keeps %s v2 lookup from silently launching v1", async status => {
    api.getLearningV2Path.mockResolvedValue({ status });
    const html = renderToString(await LearningReviewPage({ searchParams: Promise.resolve({ motor: "guided-v2", ruta: "route" }) }));
    expect(html).toContain("Tu historial se conserva");
    expect(html).not.toContain("guided-v1"); expect(api.getLearningV2State).not.toHaveBeenCalled();
  });
  it("preserves unavailable state rather than rendering zero due reviews", async () => {
    const fixture = studentFixture("review");
    api.getLearningV2Path.mockResolvedValue({ status: "ready", value: { path: fixture.path } });
    api.getLearningV2State.mockResolvedValue({ status: "unavailable" });
    const html = renderToString(await LearningReviewPage({ searchParams: Promise.resolve({ motor: "guided-v2", ruta: "route" }) }));
    expect(html).toContain("Estado por confirmar"); expect(html).not.toContain("0 repasos");
  });
});
