# Color Region Analyzer

A web-based tool that allows users to upload an image, select a region using various shapes, and calculate the average hex color value of that region.

## Features

- **Image Upload**: Upload any image from your device
- **Multiple Selection Tools**:
  - Rectangle: Click and drag to select rectangular regions
  - Circle: Click and drag to select circular regions
  - Polygon: Click to add points and create custom shapes (double-click to complete)
- **Color Results**: View the average color in HEX, RGB, and HSL formats
- **Copy to Clipboard**: One-click copying of color values
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. Click "Upload Image" and select an image from your device
2. Choose a selection tool (Rectangle, Circle, or Polygon)
3. Draw your selection on the image:
   - **Rectangle/Circle**: Click and drag
   - **Polygon**: Click to add points, double-click to finish
4. View the average color result
5. Click the copy button next to any color value to copy it to clipboard

## Deployment Options

### Option 1: GitHub Pages (Free & Easy)

1. Create a new GitHub repository
2. Upload these files to the repository:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
3. Go to repository Settings → Pages
4. Under "Source", select "main" branch
5. Click Save
6. Your site will be available at `https://yourusername.github.io/repository-name`

### Option 2: Netlify (Free with Drag & Drop)

1. Go to [netlify.com](https://netlify.com)
2. Sign up for a free account
3. Drag and drop the project folder onto Netlify's deploy area
4. Your site will be live instantly with a generated URL
5. You can customize the URL in site settings

### Option 3: Vercel (Free)

1. Go to [vercel.com](https://vercel.com)
2. Sign up for a free account
3. Click "New Project"
4. Import from Git or upload the files
5. Deploy with one click

### Option 4: Local Testing

1. Simply open `index.html` in any modern web browser
2. No server required for basic functionality

## Browser Compatibility

Works with all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Technical Details

### Technologies Used
- Pure HTML5, CSS3, and JavaScript (no frameworks required)
- Canvas API for image manipulation
- FileReader API for image upload

### Color Calculation Algorithm
The tool:
1. Extracts pixel data from the selected region
2. Filters pixels based on the selected shape (for circles and polygons)
3. Calculates the arithmetic mean of RGB values
4. Converts to HEX and HSL formats

### File Structure
```
mixcolories/
├── index.html      # Main HTML structure
├── style.css       # Styling and layout
├── script.js       # Application logic
└── README.md       # Documentation
```

## Privacy

- All processing happens in your browser
- No images or data are uploaded to any server
- Completely client-side application

## Future Enhancements

Possible additions:
- Freehand drawing selection
- Multiple color analysis (color palette extraction)
- Export selected region as image
- Color history tracking
- Advanced color analysis (dominant colors, color distribution)

## License

Free to use and modify for personal and commercial projects.

## Credits

Created with the goal of making color analysis accessible to everyone.
