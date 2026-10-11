// Safari loads <audio> and <video> in byte ranges. A cached file must answer such
// requests with 206 Partial Content, otherwise music and the story film stay silent.
(() => {
  async function rangeResponse(response, header) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || "").trim());
    if (!match || (match[1] === "" && match[2] === "")) return response;
    const blob = await response.blob();
    const size = blob.size;
    let start, end;
    if (match[1] === "") { start = Math.max(0, size - Number(match[2])); end = size - 1; }
    else { start = Number(match[1]); end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1); }
    const type = response.headers.get("Content-Type") || "application/octet-stream";
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new Response(blob.slice(start, end + 1, type), { status: 206, headers: {
      "Content-Type": type, "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes" } });
  }
  globalThis.RiftRangeResponse = rangeResponse;
})();
