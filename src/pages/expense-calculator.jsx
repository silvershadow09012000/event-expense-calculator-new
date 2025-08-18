  useEffect(() => {
    (async () => {
      try {
        // Try admin-provided items first
        const r = await fetch("/api/items");
        const j = await r.json();
        if (j?.ok && j.items) {
          setEventItems((prev) => ({ ...prev, ...j.items }));
          pushToast("success", "Loaded admin items.");
          return;
        }
        // Fallback to sample file in /public
        async function tryLoad(url, kind) {
          const res = await fetch(url);
          if (!res.ok) throw new Error("not-ok");
          if (kind === "xlsx") {
            const buf = await res.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            if (!wb.SheetNames?.length) throw new Error("no-sheets");
            const sheet = wb.Sheets[wb.SheetNames[0]];
            return XLSX.utils.sheet_to_json(sheet, { header: 1 });
          } else {
            const text = await res.text();
            return text
              .split(/\r?\n/)
              .filter(Boolean)
              .map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "")));
          }
        }
        let rows;
        try {
          rows = await tryLoad("/sample.xlsx", "xlsx");
        } catch {
          rows = await tryLoad("/sample.csv", "csv");
        }
        if (!rows || !rows.length) { pushToast("error", "The sheet appears empty."); return; }

        const header = (rows[0] || []).map((h) => String(h || "").trim());
        const lc = new Map(header.map((h, i) => [h.toLowerCase(), i]));
        const required = ["eventtype", "item", "price"];
        const missing = required.filter((r) => !lc.has(r));
        if (missing.length) { pushToast("error", `Invalid headers. Missing: ${missing.join(", ")}. Expected: EventType, Item, Price`); return; }

        const idxE = lc.get("eventtype"), idxI = lc.get("item"), idxP = lc.get("price");
        const grouped = {};
        for (let r2 = 1; r2 < rows.length; r2++) {
          const row = rows[r2] || [];
          const ev = String(row[idxE] ?? "").trim();
          const name = String(row[idxI] ?? "").trim();
          const price = Number(row[idxP]);
          if (!ev || !name || !Number.isFinite(price)) continue;
          const key = ev.toLowerCase();
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id: Date.now() + r2, name, price });
        }
        if (!Object.keys(grouped).length) { pushToast("error", "No valid rows found in the sheet."); return; }
        setEventItems((prev) => ({ ...prev, ...grouped }));
        pushToast("success", "Loaded sample items.");
      } catch (e) {
        console.error(e);
        pushToast("error", "Failed to load items.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
