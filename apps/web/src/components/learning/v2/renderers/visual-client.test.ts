import { describe, expect, it, vi } from "vitest";
import { createV2PlayerClient, readV2AttemptImage } from "../client";
import { fixtureId, studentFixture } from "../fixtures";

const resource = () => ({ activityKey:"hotspot",attemptVersion:1,image:{assetKey:"figure",url:"https://media.example.test/private.png?signature=fixture",alt:"Figura",expiresAt:new Date(Date.now()+60000).toISOString()} });
describe("T030 image resource and accessible transport",()=>{
  it("binds media reads to active key, version and asset without caching",async()=>{
    const fetcher=vi.fn().mockResolvedValue(Response.json(resource()));
    const image=await readV2AttemptImage(fixtureId(4),'hotspot','figure',1,undefined,fetcher);
    expect(image.assetKey).toBe('figure');expect(fetcher.mock.calls[0]![0]).toContain('/image?activityKey=hotspot&expectedVersion=1');expect(fetcher.mock.calls[0]![1]).toMatchObject({cache:'no-store'});
  });
  it("rejects foreign, stale, expired, insecure and leaked image resources",async()=>{
    const valid=resource();
    for(const value of [{...valid,activityKey:'foreign'},{...valid,attemptVersion:2},{...valid,image:{...valid.image,assetKey:'other'}},{...valid,image:{...valid.image,expiresAt:'2020-01-01T00:00:00Z'}},{...valid,image:{...valid.image,url:'file:///private'}},{...valid,polygon:[]}]) {
      await expect(readV2AttemptImage(fixtureId(4),'hotspot','figure',1,undefined,vi.fn().mockResolvedValue(Response.json(value)))).rejects.toThrow();
    }
  });
  it("retries accessible transitions with the same identity and validates confirmed variant",async()=>{
    const f=studentFixture(),attempt={...f.attempt,rowVersion:2,accessiblePractice:{sourceActivityKey:'hotspot'},activeActivity:{key:'variant',objectiveKey:'objective-a',phase:'apply',representation:'text',kind:'single_choice',prompt:'Variante',payload:{options:[{key:'yes',text:'A'},{key:'no',text:'B'}]}}};
    const fetcher=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(Response.json({attempt,state:f.state}));
    const client=createV2PlayerClient(fixtureId(4),fetcher,()=>fixtureId(90),()=>null);
    const action={operation:'alternative' as const,body:{activityKey:'hotspot',expectedVersion:1}};
    await expect(client.execute(action)).rejects.toThrow();expect(client.pending()).toEqual(action);expect((await client.retry()).operation).toBe('alternative');
    expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]);expect(fetcher.mock.calls[0]![0]).toContain('/alternative');expect(client.pending()).toBeNull();
    const bad=createV2PlayerClient(fixtureId(4),vi.fn().mockResolvedValue(Response.json({attempt:{...attempt,accessiblePractice:{sourceActivityKey:'other'}},state:f.state})),()=>fixtureId(91),()=>null);
    await expect(bad.execute(action)).rejects.toThrow();expect(bad.pending()).toEqual(action);
  });
});
