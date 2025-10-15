class ColorRegionAnalyzer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.image = null;
        this.imageData = null; // Store original image data
        this.currentTool = 'freehand';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.polygonPoints = [];
        this.freehandPoints = [];
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 5;
        this.currentHexColor = '#000000';

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Upload button
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('imageUpload').click();
        });

        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool === 'clear') {
                    this.clearSelection();
                } else {
                    this.setTool(tool);
                }
            });
        });

        // Zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoom').addEventListener('click', () => this.resetZoom());

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Copy buttons
        document.getElementById('copyHex').addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('hexValue').textContent);
        });
        document.getElementById('copyRgb').addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('rgbValue').textContent);
        });
        document.getElementById('copyHsl').addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('hslValue').textContent);
        });

        // Unmixer button
        document.getElementById('openUnmixer').addEventListener('click', () => {
            this.openInUnmixer();
        });
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.zoom = 1;
                this.setupCanvas();
                this.showTools();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    setupCanvas() {
        // Calculate canvas size to fit the image while maintaining aspect ratio
        const maxWidth = 1000;
        const maxHeight = 700;
        let width = this.image.width;
        let height = this.image.height;

        if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.drawImage();
        this.updateZoomDisplay();
    }

    drawImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        // Store the original image data for color calculations
        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    showTools() {
        document.getElementById('toolsSection').style.display = 'block';
        document.getElementById('canvasSection').style.display = 'block';
    }

    setTool(tool) {
        this.currentTool = tool;
        this.polygonPoints = [];
        this.freehandPoints = [];

        // Update active button
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            }
        });

        // Update instructions
        const instructions = {
            'freehand': 'Click and drag to draw freehand',
            'rectangle': 'Click and drag to draw a rectangle',
            'circle': 'Click and drag to draw a circle',
            'polygon': 'Click to add points, double-click to complete the polygon'
        };
        document.getElementById('instructions').textContent = instructions[tool];
    }

    clearSelection() {
        this.polygonPoints = [];
        this.freehandPoints = [];
        this.drawImage();
        document.getElementById('resultsSection').style.display = 'none';
    }

    zoomIn() {
        this.zoom = Math.min(this.maxZoom, this.zoom + 0.2);
        this.applyZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.minZoom, this.zoom - 0.2);
        this.applyZoom();
    }

    resetZoom() {
        this.zoom = 1;
        this.applyZoom();
    }

    applyZoom() {
        this.canvas.style.transform = `scale(${this.zoom})`;
        this.updateZoomDisplay();
    }

    updateZoomDisplay() {
        document.getElementById('zoomLevel').textContent = `${Math.round(this.zoom * 100)}%`;
    }

    handleWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleMouseDown(e) {
        const coords = this.getCanvasCoordinates(e);

        if (this.currentTool === 'polygon') {
            this.handlePolygonClick(coords);
        } else if (this.currentTool === 'freehand') {
            this.isDrawing = true;
            this.freehandPoints = [coords];
        } else {
            this.isDrawing = true;
            this.startX = coords.x;
            this.startY = coords.y;
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;

        const coords = this.getCanvasCoordinates(e);

        if (this.currentTool === 'freehand') {
            this.freehandPoints.push(coords);
            this.drawImage();
            this.drawFreehand(this.freehandPoints);
        } else if (this.currentTool === 'rectangle') {
            this.drawImage();
            this.drawPreviewRectangle(this.startX, this.startY, coords.x, coords.y);
        } else if (this.currentTool === 'circle') {
            this.drawImage();
            this.drawPreviewCircle(this.startX, this.startY, coords.x, coords.y);
        }
    }

    handleMouseUp(e) {
        if (!this.isDrawing || this.currentTool === 'polygon') return;

        this.isDrawing = false;
        const coords = this.getCanvasCoordinates(e);

        if (this.currentTool === 'freehand') {
            if (this.freehandPoints.length >= 3) {
                this.calculatePolygonColor(this.freehandPoints);
            }
        } else if (this.currentTool === 'rectangle') {
            this.calculateRectangleColor(this.startX, this.startY, coords.x, coords.y);
        } else if (this.currentTool === 'circle') {
            this.calculateCircleColor(this.startX, this.startY, coords.x, coords.y);
        }
    }

    handlePolygonClick(coords) {
        // Double-click detection
        const now = Date.now();
        const lastClick = this.lastClickTime || 0;
        this.lastClickTime = now;

        if (now - lastClick < 300 && this.polygonPoints.length >= 3) {
            // Double-click: complete polygon
            this.calculatePolygonColor(this.polygonPoints);
            return;
        }

        this.polygonPoints.push(coords);
        this.drawImage();
        this.drawPolygon(this.polygonPoints, false);
    }

    drawFreehand(points) {
        if (points.length < 2) return;

        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawPreviewRectangle(x1, y1, x2, y2) {
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    drawPreviewCircle(centerX, centerY, edgeX, edgeY) {
        const radius = Math.sqrt(Math.pow(edgeX - centerX, 2) + Math.pow(edgeY - centerY, 2));
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawPolygon(points, closed = true) {
        if (points.length === 0) return;

        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        if (closed) {
            this.ctx.closePath();
        }
        this.ctx.fill();
        this.ctx.stroke();

        // Draw points
        points.forEach(point => {
            this.ctx.fillStyle = '#667eea';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    calculateRectangleColor(x1, y1, x2, y2) {
        const left = Math.floor(Math.min(x1, x2));
        const top = Math.floor(Math.min(y1, y2));
        const width = Math.floor(Math.abs(x2 - x1));
        const height = Math.floor(Math.abs(y2 - y1));

        if (width < 1 || height < 1) return;

        // Use stored original image data
        const pixels = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelX = left + x;
                const pixelY = top + y;
                if (pixelX >= 0 && pixelX < this.canvas.width && pixelY >= 0 && pixelY < this.canvas.height) {
                    const index = (pixelY * this.canvas.width + pixelX) * 4;
                    pixels.push({
                        r: this.imageData.data[index],
                        g: this.imageData.data[index + 1],
                        b: this.imageData.data[index + 2]
                    });
                }
            }
        }

        if (pixels.length === 0) return;

        const avgColor = {
            r: Math.round(pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length),
            g: Math.round(pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length),
            b: Math.round(pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length)
        };

        this.displayResults(avgColor);
    }

    calculateCircleColor(centerX, centerY, edgeX, edgeY) {
        const radius = Math.sqrt(Math.pow(edgeX - centerX, 2) + Math.pow(edgeY - centerY, 2));
        if (radius < 1) return;

        // Get bounding box
        const left = Math.max(0, Math.floor(centerX - radius));
        const top = Math.max(0, Math.floor(centerY - radius));
        const right = Math.min(this.canvas.width, Math.ceil(centerX + radius));
        const bottom = Math.min(this.canvas.height, Math.ceil(centerY + radius));

        // Filter pixels that are within the circle using original image data
        const pixels = [];
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= radius) {
                    const index = (y * this.canvas.width + x) * 4;
                    pixels.push({
                        r: this.imageData.data[index],
                        g: this.imageData.data[index + 1],
                        b: this.imageData.data[index + 2]
                    });
                }
            }
        }

        if (pixels.length === 0) return;

        const avgColor = {
            r: Math.round(pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length),
            g: Math.round(pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length),
            b: Math.round(pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length)
        };

        this.displayResults(avgColor);
    }

    calculatePolygonColor(points) {
        if (points.length < 3) return;

        // Get bounding box
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const left = Math.max(0, Math.floor(Math.min(...xs)));
        const top = Math.max(0, Math.floor(Math.min(...ys)));
        const right = Math.min(this.canvas.width, Math.ceil(Math.max(...xs)));
        const bottom = Math.min(this.canvas.height, Math.ceil(Math.max(...ys)));

        // Filter pixels that are within the polygon using original image data
        const pixels = [];
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                if (this.isPointInPolygon(x, y, points)) {
                    const index = (y * this.canvas.width + x) * 4;
                    pixels.push({
                        r: this.imageData.data[index],
                        g: this.imageData.data[index + 1],
                        b: this.imageData.data[index + 2]
                    });
                }
            }
        }

        if (pixels.length === 0) return;

        const avgColor = {
            r: Math.round(pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length),
            g: Math.round(pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length),
            b: Math.round(pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length)
        };

        this.displayResults(avgColor);
    }

    isPointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    calculateAverageColor(imageData) {
        let totalR = 0, totalG = 0, totalB = 0;
        const pixelCount = imageData.data.length / 4;

        for (let i = 0; i < imageData.data.length; i += 4) {
            totalR += imageData.data[i];
            totalG += imageData.data[i + 1];
            totalB += imageData.data[i + 2];
        }

        return {
            r: Math.round(totalR / pixelCount),
            g: Math.round(totalG / pixelCount),
            b: Math.round(totalB / pixelCount)
        };
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    displayResults(color) {
        const hex = this.rgbToHex(color.r, color.g, color.b);
        const hsl = this.rgbToHsl(color.r, color.g, color.b);

        this.currentHexColor = hex;

        document.getElementById('colorSwatch').style.backgroundColor = hex;
        document.getElementById('colorSwatch').classList.add('animate');

        document.getElementById('hexValue').textContent = hex;
        document.getElementById('rgbValue').textContent = `rgb(${color.r}, ${color.g}, ${color.b})`;
        document.getElementById('hslValue').textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

        document.getElementById('resultsSection').style.display = 'block';

        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    openInUnmixer() {
        // Remove # from hex color
        const hexColor = this.currentHexColor.replace('#', '');

        // Open TryColors Unmixer
        // Note: Due to browser security (cross-origin policy), we cannot automatically
        // fill in the color input field on their website
        const url = `https://trycolors.com/unmixer#${hexColor}`;
        window.open(url, '_blank');

        // Copy hex to clipboard so user can easily paste it
        navigator.clipboard.writeText(this.currentHexColor).then(() => {
            this.showToast(`Opening TryColors Unmixer...\nColor ${this.currentHexColor} copied to clipboard!\nPaste it into the "Select Target Color" field.`);
        }).catch(() => {
            this.showToast('Opening TryColors Unmixer...');
        });
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!');
        }).catch(() => {
            this.showToast('Failed to copy');
        });
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ColorRegionAnalyzer();
});
