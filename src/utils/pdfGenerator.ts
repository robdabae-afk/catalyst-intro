
// Access jsPDF from CDN
const { jsPDF } = (window as any).jspdf;

export const generatePDF = async (slides: any[]) => {
    // Landscape A4-ish (16:9 ratio in mm -> 297x167 roughly, or just use A4 Landscape)
    // A4 is 297x210. 16:9 would be 297x167. 
    // We'll stick to A4 Landscape for better printing support, with black background filling it.
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 10;

    const addSlideBackground = () => {
        doc.setFillColor(0, 0, 0); // Black
        doc.rect(0, 0, width, height, 'F');
    };

    const addCommonElements = (s: any) => {
        // Subtitle (Top Left)
        if (s.subtitle) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(221, 85, 85); // #DD5555
            doc.text(s.subtitle.toUpperCase(), margin, margin + 4, { charSpace: 1 });
        }
        // Title (Main)
        if (s.title) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text(doc.splitTextToSize(s.title, width - (margin * 2)), margin, margin + 15);
        }
        // Narrative (Footer-ish, centered or left)
        if (s.narrative) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(170, 170, 170); // #AAAAAA
            // Split if too long
            const text = doc.splitTextToSize(s.narrative, width - 40);
            doc.text(text, width / 2, height - 10, { align: "center" });
        }
    };

    // Iterate through slides
    for (let i = 0; i < slides.length; i++) {
        if (i > 0) doc.addPage();
        const s = slides[i];

        addSlideBackground();
        addCommonElements(s);

        const contentY = 40; // Start below title

        switch (s.type) {
            case 'three-col-text':
                // Horizontal column layout
                if (s.items) {
                    const colCount = 3;
                    const colW = (width - (margin * 2) - (10 * (colCount - 1))) / colCount;

                    s.items.forEach((item: any, idx: number) => {
                        const x = margin + (idx * (colW + 10));
                        const y = contentY;

                        // Card Background
                        doc.setFillColor(15, 15, 15); // Slightly lighter black
                        doc.setDrawColor(51, 51, 51); // #333333 border
                        doc.roundedRect(x, y, colW, 100, 3, 3, 'FD');

                        // Title
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(14);
                        doc.setTextColor(255, 255, 255);
                        doc.text(item.title, x + 5, y + 10);

                        // Description (Visible!)
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(11);
                        doc.setTextColor(170, 170, 170);
                        const descLines = doc.splitTextToSize(item.desc, colW - 10);
                        doc.text(descLines, x + 5, y + 25);
                    });
                }
                break;

            case 'thesis-swipe':
                // Mockup of the card
                if (s.subhead) {
                    doc.setFontSize(14);
                    doc.setTextColor(255, 255, 255);
                    doc.text(doc.splitTextToSize(s.subhead, width / 2), margin, contentY);
                }
                if (s.content) {
                    doc.setFontSize(12);
                    doc.setTextColor(170, 170, 170);
                    doc.text(doc.splitTextToSize(s.content, width / 2), margin, contentY + 25);
                }

                // Draw a card representation on the right
                const cardX = width / 2 + 10;
                doc.setFillColor(20, 20, 20);
                doc.setDrawColor(255, 255, 255);
                doc.roundedRect(cardX, contentY, 80, 100, 4, 4, 'FD');

                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.text("Founder Profile (Interactive)", cardX + 40, contentY + 10, { align: "center" });

                // Try to draw some shapes for "Traction"
                doc.setFillColor(221, 85, 85);
                doc.rect(cardX + 10, contentY + 80, 20, 4, 'F');
                doc.setFillColor(51, 51, 51);
                doc.rect(cardX + 35, contentY + 80, 20, 4, 'F');
                break;

            case 'growth-chart':
                // Simple textual table for data
                doc.setFontSize(16);
                doc.setTextColor(255, 255, 255);
                doc.text("Growth Trajectory", margin, contentY);

                if (s.items) {
                    const tableX = margin;
                    const tableY = contentY + 15;
                    const rowH = 15;
                    const colW = 60;

                    // Header
                    doc.setFillColor(34, 34, 34);
                    doc.rect(tableX, tableY, colW * 3, rowH, 'F');
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.text("Timeframe", tableX + 5, tableY + 10);
                    doc.text("Revenue", tableX + colW + 5, tableY + 10);
                    doc.text("Users", tableX + (colW * 2) + 5, tableY + 10);

                    // Rows
                    s.items.forEach((row: any, rIdx: number) => {
                        const y = tableY + rowH + (rIdx * rowH);
                        doc.setFillColor(0, 0, 0);
                        doc.setDrawColor(51, 51, 51);
                        doc.rect(tableX, y, colW * 3, rowH, 'S'); // Stroke only

                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(200, 200, 200);
                        doc.text(row.label, tableX + 5, y + 10);
                        doc.text(row.revenue, tableX + colW + 5, y + 10);
                        doc.text(row.users, tableX + (colW * 2) + 5, y + 10);
                    });
                }
                break;

            case 'revenue-comparison':
                // 3 buckets
                if (s.items && s.items.current) {
                    const buckets = [s.items.current, s.items.cfApproved, s.items.miniIPO];
                    const bW = (width - (margin * 2) - 20) / 3;

                    buckets.forEach((b, idx) => {
                        const bx = margin + (idx * (bW + 10));
                        const by = contentY + 10;

                        doc.setDrawColor(51, 51, 51);
                        doc.setFillColor(15, 15, 15);
                        doc.roundedRect(bx, by, bW, 80, 3, 3, 'FD');

                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(13);
                        doc.setTextColor(255, 255, 255);
                        doc.text(b.title, bx + bW / 2, by + 10, { align: "center" });

                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.setTextColor(170, 170, 170);
                        const desc = doc.splitTextToSize(b.description, bW - 10);
                        doc.text(desc, bx + 5, by + 25);

                        doc.setFont("courier", "bold");
                        doc.setFontSize(14);
                        doc.setTextColor(255, 255, 255);
                        doc.text(b.revenue, bx + bW / 2, by + 70, { align: "center" });
                    });
                }
                break;

            default:
                if (s.content) {
                    doc.setFontSize(14);
                    doc.setTextColor(220, 220, 220);
                    doc.text(doc.splitTextToSize(s.content, width - (margin * 2)), margin, contentY);
                }
                break;
        }
    }

    doc.save("Catalyst_Intro_Deck.pdf");
};
