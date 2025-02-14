function deduplicateBySourceKeepLatest(results) {
    // 1) First pass: map each normalized source to its latest occurrence
    const latestMap = new Map();
    
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      let normalized = (r.source || "unknown").toLowerCase()
        .replace(/(\.com|\.net|[^a-z0-9]+)/g, ""); 
      // This ensures that for each source, we store the *last* item we encounter
      latestMap.set(normalized, r);
    }
    
    // 2) Second pass: build final array in original order
    const finalList = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      let normalized = (r.source || "unknown").toLowerCase()
        .replace(/(\.com|\.net|[^a-z0-9]+)/g, "");
      
      // Only include the item if it matches the "latest" object we stored
      if (latestMap.get(normalized) === r) {
        finalList.push(r);
      }
    }
    
    return finalList;
  }

  module.exports = { deduplicateBySourceKeepLatest };
