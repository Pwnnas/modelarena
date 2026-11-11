# Capture bundle

The telemetry capture lives in this folder, split into three parts:

```
part-01.b64  part-02.b64  part-03.b64
```

Each file is the **base64 encoding of one chunk of a single gzip stream**. To recover
the capture:

1. Base64-decode each part to raw bytes.
2. Concatenate the bytes in part order (01, 02, 03).
3. Gunzip the result.
4. Parse it as JSONL: one JSON object per line, `{"hex": "<packet hex>"}`.

`manifest.json` lists the SHA-256 and byte length of each decoded chunk, the SHA-256 of
the full gzip stream, and the record count. Verify your pipeline against it before
embedding the packets in your app.

Example (bash):

```sh
base64 -d part-01.b64 > p1.bin
base64 -d part-02.b64 > p2.bin
base64 -d part-03.b64 > p3.bin
cat p1.bin p2.bin p3.bin | gunzip > capture.jsonl
sha256sum p1.bin p2.bin p3.bin   # compare with manifest.json
wc -l capture.jsonl              # 26 records
```

The packets use the protocol described in `PROMPT.md`. Some of them are deliberately
corrupt — your decoder must classify them, and the explorer must show them as invalid.