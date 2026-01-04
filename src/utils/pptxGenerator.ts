
import PptxGenJS from "pptxgenjs";

export const generatePPTX = async (slides: any[]) => {
    const pres = new PptxGenJS();
    pres.layout = "LAYOUT_16x9";
    pres.theme = { headFontFace: "Arial", bodyFontFace: "Arial" }; // safe fonts

    // Global background
    pres.defineSlideMaster({
        title: "DARK_THEME",
        background: { color: "000000" },
        objects: []
    });

    const addCommonElements = (slide: PptxGenJS.Slide, s: any) => {
        if (s.subtitle) {
            slide.addText(s.subtitle, { x: 0.5, y: 0.3, w: '90%', fontSize: 14, color: "DD5555", align: "left", fontFace: "Courier New", charSpacing: 2 });
        }
        if (s.title) {
            slide.addText(s.title, { x: 0.5, y: 0.6, w: '90%', fontSize: 28, bold: true, color: "FFFFFF", align: "left" });
        }
        if (s.narrative) {
            slide.addText(s.narrative, { x: 0.5, y: 4.8, w: '90%', fontSize: 10, color: "444444", italic: true, align: "center" });
        }
    }

    slides.forEach(s => {
        let slide = pres.addSlide({ masterName: "DARK_THEME" });
        addCommonElements(slide, s);

        const contentY = 1.5;

        switch (s.type) {
            case 'three-col-text':
                // Problem Slide - Horizontal columns
                if (s.items) {
                    s.items.forEach((item: any, i: number) => {
                        const colW = 2.8;
                        const gap = 0.2;
                        const x = 0.5 + (i * (colW + gap));

                        // Card bg
                        slide.addShape(pres.ShapeType.roundRect, { x: x, y: contentY, w: colW, h: 3.0, fill: { color: "111111" }, line: { color: "333333", width: 1 } });

                        // Title
                        slide.addText(item.title, { x: x + 0.2, y: contentY + 0.2, w: colW - 0.4, fontSize: 16, bold: true, color: "FFFFFF" });

                        // Description (Always visible)
                        slide.addText(item.desc, { x: x + 0.2, y: contentY + 0.8, w: colW - 0.4, fontSize: 12, color: "AAAAAA" });
                    });
                }
                break;

            case 'thesis-swipe':
                slide.addText(s.subhead, { x: 0.5, y: contentY, w: 4.0, fontSize: 18, color: "DDDDDD" });
                slide.addText(s.content, { x: 0.5, y: contentY + 1.0, w: 4.0, fontSize: 14, color: "AAAAAA" });

                // Card visual placeholder
                slide.addShape(pres.ShapeType.roundRect, { x: 5.0, y: contentY, w: 4.0, h: 3.0, fill: { color: "111111" }, line: { color: "FFFFFF", width: 1 } });
                slide.addText("Interactive Swipe Card\n(Founder Profile)", { x: 5.0, y: contentY + 1.2, w: 4.0, align: "center", color: "555555" });
                break;

            case 'stats-row-pain':
            case 'pain-combo':
                if (s.content) {
                    slide.addText(s.content, { x: 0.5, y: contentY, w: 9.0, fontSize: 14, color: "CCCCCC" });
                }
                if (s.items && Array.isArray(s.items)) {
                    s.items.forEach((item: any, i: number) => {
                        const w = 2.5;
                        const x = 1.0 + (i * 3.0);
                        slide.addText(item.value, { x: x, y: contentY + 1.5, w: w, fontSize: 24, bold: true, color: i < 2 ? "DD5555" : "FFFFFF", align: "center" });
                        slide.addText(item.label, { x: x, y: contentY + 2.0, w: w, fontSize: 12, color: "AAAAAA", align: "center" });
                    });
                }
                break;

            case 'tam-sam-som':
                // List representation
                if (s.items && Array.isArray(s.items)) {
                    s.items.forEach((item: any, i: number) => {
                        const y = contentY + (i * 1.0);
                        slide.addText(item.label, { x: 1.0, y: y, w: 1.0, fontSize: 20, bold: true, color: "FFFFFF" });
                        slide.addText(`${item.value} (${item.time})`, { x: 2.2, y: y, w: 3.0, fontSize: 18, color: "DD5555" });
                        slide.addText(item.desc, { x: 5.5, y: y, w: 4.0, fontSize: 14, color: "AAAAAA" });
                    });
                }
                break;

            case 'growth-chart':
                // Data table representation
                slide.addText("Projected Growth", { x: 0.5, y: contentY, w: 4.0, fontSize: 14, color: "AAAAAA" });
                if (s.items && Array.isArray(s.items)) {
                    const rows: any[] = [
                        [{ text: "Year", options: { bold: true, color: "FFFFFF", fill: "222222" } }, { text: "Revenue", options: { bold: true, color: "FFFFFF", fill: "222222" } }, { text: "Users", options: { bold: true, color: "FFFFFF", fill: "222222" } }]
                    ];
                    s.items.forEach((item: any) => {
                        rows.push([
                            { text: item.label, options: { color: "DDDDDD", fill: "111111" } },
                            { text: item.revenue, options: { color: "DDDDDD", fill: "111111" } },
                            { text: item.users, options: { color: "DDDDDD", fill: "111111" } }
                        ]);
                    });
                    slide.addTable(rows, { x: 0.5, y: contentY + 0.5, w: 8.0, color: "FFFFFF" });
                }
                break;

            case 'comparison-table':
                // Replicate table logic
                {
                    const headerOpts = { bold: true, color: "FFFFFF", fill: "222222", align: "center" as const };
                    const cellOpts = { color: "CCCCCC", fill: "000000", align: "center" as const };
                    const cellHighlight = { color: "FFFFFF", fill: "111111", bold: true, align: "center" as const };

                    const rows = [
                        [
                            { text: "Feature", options: { ...headerOpts, align: "left" as const } },
                            { text: "AngelList", options: headerOpts },
                            { text: "Wefunder", options: headerOpts },
                            { text: "Catalyst (Today)", options: { ...headerOpts, color: "AAAAAA" } },
                            { text: "End-State", options: headerOpts }
                        ],
                        [
                            { text: "Discovery UX", options: { ...cellOpts, align: "left" as const, color: "AAAAAA" } },
                            { text: "List", options: cellOpts },
                            { text: "Campaign", options: cellOpts },
                            { text: "Swipe", options: { ...cellOpts, color: "AAAAAA" } },
                            { text: "Swipe", options: cellHighlight },
                        ],
                        [
                            { text: "Capital Exec", options: { ...cellOpts, align: "left" as const, color: "AAAAAA" } },
                            { text: "Yes", options: cellOpts },
                            { text: "Yes", options: cellOpts },
                            { text: "No", options: { ...cellOpts, color: "AAAAAA" } },
                            { text: "Yes", options: cellHighlight },
                        ],
                        [
                            { text: "Target User", options: { ...cellOpts, align: "left" as const, color: "AAAAAA" } },
                            { text: "Funds", options: cellOpts },
                            { text: "Public", options: cellOpts },
                            { text: "Professionals", options: { ...cellOpts, color: "AAAAAA" } },
                            { text: "Pro + Retail", options: cellHighlight },
                        ],
                        [
                            { text: "Min Check", options: { ...cellOpts, align: "left" as const, color: "AAAAAA" } },
                            { text: "$1k+", options: cellOpts },
                            { text: "$100+", options: cellOpts },
                            { text: "~$500", options: { ...cellOpts, color: "AAAAAA" } },
                            { text: "~$500", options: cellHighlight },
                        ],
                    ];
                    slide.addTable(rows, { x: 0.5, y: contentY, w: 9.0 });
                }
                break;

            case 'revenue-comparison':
                if (s.items && s.items.current) {
                    const drawBox = (obj: any, xVal: number) => {
                        slide.addShape(pres.ShapeType.roundRect, { x: xVal, y: contentY, w: 2.8, h: 2.5, fill: { color: "111111" }, line: { color: "333333" } });
                        slide.addText(obj.title, { x: xVal + 0.1, y: contentY + 0.2, w: 2.6, fontSize: 14, bold: true, color: "FFFFFF", align: "center" });
                        slide.addText(obj.description, { x: xVal + 0.1, y: contentY + 0.8, w: 2.6, fontSize: 10, color: "AAAAAA", align: "center" });
                        slide.addText(obj.revenue, { x: xVal + 0.1, y: contentY + 1.8, w: 2.6, fontSize: 14, fontFace: "Courier New", color: "FFFFFF", align: "center" });
                    };
                    drawBox(s.items.current, 0.5);
                    drawBox(s.items.cfApproved, 3.5);
                    drawBox(s.items.miniIPO, 6.5);
                }
                break;

            case 'flow-revenue':
                if (s.items) {
                    slide.addText(`Capital Flow (SOM): ${s.items.som}`, { x: 0.5, y: contentY, w: 9.0, fontSize: 14, color: "AAAAAA" });
                    slide.addText(`Take Rate: ${s.items.rate}`, { x: 0.5, y: contentY + 0.5, w: 9.0, fontSize: 14, color: "AAAAAA" });
                    slide.addText(`Projected ARR: ${s.items.revenue}`, { x: 0.5, y: contentY + 1.0, w: 9.0, fontSize: 20, bold: true, color: "FFFFFF" });
                }
                break;

            case 'qa-slide':
                // If any
                break;

            default:
                // Fallback for generic text
                if (s.content) {
                    slide.addText(s.content, { x: 0.5, y: contentY, w: 9.0, fontSize: 14, color: "CCCCCC" });
                }
                if (s.extraContent) {
                    slide.addText(s.extraContent, { x: 0.5, y: contentY + 1.5, w: 9.0, fontSize: 12, color: "888888" });
                }
                break;
        }
    });

    await pres.writeFile({ fileName: "Catalyst_Intro_Deck.pptx" });
};
