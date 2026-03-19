/**
 * diagramEngine.js
 * MediConnect System Diagram — Rendering Engine
 * Powered by D3.js v7
 * 
 * Features:
 *   - Vibrant color-coded collapsible tree
 *   - Rounded-rect nodes with gradient fills
 *   - Smooth curved links with color inheritance
 *   - Hover tooltip
 *   - Zoom / Pan / Fit / Expand-all controls
 */

(function () {
    "use strict";

    // ── Color Palette ──
    const palette = {
        root:     { bg: "#6366f1", bgEnd: "#818cf8", text: "#fff",    link: "#6366f1" },
        user:     { bg: "#ec4899", bgEnd: "#f472b6", text: "#fff",    link: "#ec4899" },
        admin:    { bg: "#f59e0b", bgEnd: "#fbbf24", text: "#1c1917", link: "#f59e0b" },
        doctor:   { bg: "#10b981", bgEnd: "#34d399", text: "#fff",    link: "#10b981" },
        shared:   { bg: "#06b6d4", bgEnd: "#22d3ee", text: "#fff",    link: "#06b6d4" },
        decision:   { bg: "#8b5cf6", bgEnd: "#a78bfa", text: "#fff",    link: "#8b5cf6" },
        superadmin: { bg: "#ef4444", bgEnd: "#f87171", text: "#fff",    link: "#ef4444" }
    };

    const nodeW = 170, nodeH = 36, nodeR = 10;

    // ── Populate Key Notes ──
    const notesList = document.getElementById("key-notes-list");
    if (notesList && typeof systemKeyNotes !== "undefined") {
        systemKeyNotes.forEach(n => {
            const li = document.createElement("li");
            li.textContent = n;
            notesList.appendChild(li);
        });
    }

    // ── Canvas Setup ──
    const container = document.getElementById("diagram-canvas");
    let W = container.clientWidth;
    let H = container.clientHeight;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", W)
        .attr("height", H);

    // Gradient definitions
    const defs = svg.append("defs");
    Object.entries(palette).forEach(([key, val]) => {
        const grad = defs.append("linearGradient")
            .attr("id", `grad-${key}`)
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "100%");
        grad.append("stop").attr("offset", "0%").attr("stop-color", val.bg);
        grad.append("stop").attr("offset", "100%").attr("stop-color", val.bgEnd);
    });

    // Drop shadow filter
    const filter = defs.append("filter").attr("id", "drop-shadow").attr("x", "-30%").attr("y", "-30%").attr("width", "160%").attr("height", "160%");
    filter.append("feDropShadow").attr("dx", 0).attr("dy", 3).attr("stdDeviation", 5).attr("flood-color", "rgba(0,0,0,0.35)");

    // Glow filter for hover
    const glow = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", 6).attr("result", "blur");
    const feMerge = glow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");

    // ── Zoom ──
    const zoomBehavior = d3.zoom()
        .scaleExtent([0.15, 2.5])
        .on("zoom", e => g.attr("transform", e.transform));

    svg.call(zoomBehavior).on("dblclick.zoom", null);

    // ── Tree Layout ──
    const treeLayout = d3.tree().nodeSize([52, 300]);

    const root = d3.hierarchy(diagramData, d => d.children);
    root.x0 = 0;
    root.y0 = 0;

    let idCounter = 0;
    const duration = 500;

    // ── Tooltip ──
    const tooltip = document.getElementById("tooltip");
    const ttTitle = document.getElementById("tt-title");
    const ttBody  = document.getElementById("tt-body");

    function showTip(evt, d) {
        ttTitle.textContent = d.data.name;
        ttBody.textContent = d.data.details || "";
        tooltip.style.opacity = 1;
        tooltip.style.left = (evt.pageX + 16) + "px";
        tooltip.style.top  = (evt.pageY - 10) + "px";
    }
    function hideTip() { tooltip.style.opacity = 0; }

    // ── Render ──
    function render(source) {
        const tree = treeLayout(root);
        const nodes = tree.descendants();
        const links = tree.descendants().slice(1);

        // Fixed depth
        nodes.forEach(d => d.y = d.depth * 300);

        // ── Links ──
        const link = g.selectAll("path.tree-link").data(links, d => d.id || (d.id = ++idCounter));

        const linkEnter = link.enter()
            .insert("path", "g")
            .attr("class", "tree-link link-path")
            .attr("d", () => curve({ x: source.x0, y: source.y0 }, { x: source.x0, y: source.y0 }))
            .attr("stroke", d => (palette[d.data.type] || palette.root).link);

        linkEnter.merge(link)
            .transition().duration(duration)
            .attr("d", d => curve(d, d.parent))
            .attr("stroke", d => (palette[d.data.type] || palette.root).link);

        link.exit().transition().duration(duration)
            .attr("d", () => curve({ x: source.x, y: source.y }, { x: source.x, y: source.y }))
            .remove();

        // ── Nodes ──
        const node = g.selectAll("g.node-group").data(nodes, d => d.id || (d.id = ++idCounter));

        const nodeEnter = node.enter()
            .append("g")
            .attr("class", "node-group")
            .attr("transform", () => `translate(${source.y0},${source.x0})`)
            .on("click", (evt, d) => {
                evt.stopPropagation();
                if (d.children) { d._children = d.children; d.children = null; }
                else { d.children = d._children; d._children = null; }
                render(d);
            })
            .on("mouseover", showTip)
            .on("mousemove", (evt) => {
                tooltip.style.left = (evt.pageX + 16) + "px";
                tooltip.style.top  = (evt.pageY - 10) + "px";
            })
            .on("mouseout", hideTip);

        // Node rectangle
        nodeEnter.append("rect")
            .attr("class", "node-rect")
            .attr("width", nodeW)
            .attr("height", nodeH)
            .attr("x", -nodeW / 2)
            .attr("y", -nodeH / 2)
            .attr("rx", nodeR)
            .attr("ry", nodeR)
            .attr("fill", d => `url(#grad-${d.data.type || "root"})`)
            .attr("filter", "url(#drop-shadow)")
            .attr("opacity", 0);

        // Collapse indicator (small dot)
        nodeEnter.append("circle")
            .attr("class", "collapse-dot")
            .attr("cx", nodeW / 2 - 2)
            .attr("cy", 0)
            .attr("r", 0)
            .attr("fill", "#fff")
            .attr("opacity", 0.7);

        // Label
        nodeEnter.append("text")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("fill", d => (palette[d.data.type] || palette.root).text)
            .text(d => truncate(d.data.name, 22))
            .attr("opacity", 0);

        // ── Update (merge) ──
        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition().duration(duration)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select("rect.node-rect")
            .transition().duration(duration)
            .attr("opacity", 1);

        nodeUpdate.select("text")
            .transition().duration(duration)
            .attr("opacity", 1);

        nodeUpdate.select("circle.collapse-dot")
            .transition().duration(duration)
            .attr("r", d => d._children ? 5 : 0);

        // Hover glow
        nodeUpdate.on("mouseover.glow", function (evt, d) {
            d3.select(this).select("rect").attr("filter", "url(#glow)");
            showTip(evt, d);
        }).on("mouseout.glow", function () {
            d3.select(this).select("rect").attr("filter", "url(#drop-shadow)");
            hideTip();
        });

        // ── Exit ──
        const nodeExit = node.exit().transition().duration(duration)
            .attr("transform", () => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select("rect").attr("opacity", 0);
        nodeExit.select("text").attr("opacity", 0);

        // Stash old positions
        nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
    }

    function curve(s, d) {
        return `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
    }

    function truncate(str, max) {
        return str.length > max ? str.slice(0, max - 1) + "…" : str;
    }

    // ── Collapse helpers ──
    function collapseAll(node) {
        if (node.children) {
            node._children = node.children;
            node._children.forEach(collapseAll);
            node.children = null;
        }
    }

    function expandAll(node) {
        if (node._children) {
            node.children = node._children;
            node._children = null;
        }
        if (node.children) node.children.forEach(expandAll);
    }

    // Start with depth-1 children collapsed
    if (root.children) {
        root.children.forEach(c => {
            if (c.children) {
                c.children.forEach(collapseAll);
            }
        });
    }

    // Initial render
    render(root);

    // Fit to screen initially
    fitView(false);

    function fitView(animate = true) {
        const bounds = g.node().getBBox();
        const fullW = bounds.width || 1;
        const fullH = bounds.height || 1;
        const midX = bounds.x + fullW / 2;
        const midY = bounds.y + fullH / 2;
        const scale = 0.85 / Math.max(fullW / W, fullH / H);
        const tx = W / 2 - scale * midX;
        const ty = H / 2 - scale * midY;
        const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
        if (animate) {
            svg.transition().duration(600).call(zoomBehavior.transform, transform);
        } else {
            svg.call(zoomBehavior.transform, transform);
        }
    }

    // ── Controls ──
    document.getElementById("zoom-in").addEventListener("click", () => {
        svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
    });
    document.getElementById("zoom-out").addEventListener("click", () => {
        svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
    });
    document.getElementById("zoom-fit").addEventListener("click", () => fitView(true));
    document.getElementById("expand-all").addEventListener("click", () => {
        expandAll(root);
        render(root);
        setTimeout(() => fitView(true), duration + 50);
    });

    // Resize handler
    window.addEventListener("resize", () => {
        W = container.clientWidth;
        H = container.clientHeight;
        svg.attr("width", W).attr("height", H);
    });

})();
