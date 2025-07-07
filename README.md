# 🎬 Movie Show Rating

A powerful Chrome extension that displays IMDB and Rotten Tomatoes ratings directly on streaming platforms like Hotstar, Netflix, and other movie/TV show pages. Get instant rating information without leaving your current page!

## ✨ Major Features

### 🎯 **Dual Rating System**
- **IMDB Ratings** (0-10 scale) with customizable color coding
- **Rotten Tomatoes Ratings** (0-100 scale) with customizable color coding
- Real-time rating display on movie and TV show pages

### 🎨 **Customizable Color Ranges**
- **Up to 5 custom color ranges** for both IMDB and RT ratings
- **Visual color picker** for easy color selection
- **Drag-and-drop color adjustment** with RGB value support
- **Smart validation** to prevent overlapping ranges
- **Dark Reader-inspired UI** with modern aesthetics

### 🔧 **Advanced Configuration**
- **OMDB API Integration** for comprehensive movie data
- **API Key Validation** with real-time testing
- **Range overlap detection** and validation
- **Decimal support** for IMDB ratings (e.g., 6.5, 7.8)
- **Integer-only** for Rotten Tomatoes ratings

### 🎮 **User Experience**
- **Modern popup interface** with sleek dark theme
- **Real-time validation** with detailed error messages
- **One-click reset** to default color schemes
- **Instant visual feedback** on rating changes
- **Responsive design** optimized for extension popup

### 🔒 **Data Management**
- **Chrome Storage Sync** for cross-device settings
- **Automatic tab reload** after configuration changes
- **Persistent settings** across browser sessions
- **Secure API key storage**

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the Chrome Web Store
2. Search for "Movie Show Rating"
3. Click "Add to Chrome"
4. Confirm installation

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

## 📋 Setup Instructions

### 1. Get OMDB API Key

1. Visit [OMDB API](http://www.omdbapi.com/apikey.aspx)
2. Request a free API key
3. Verify your email address
4. Copy your API key

### 2. Configure the Extension
1. Click the extension icon in your toolbar
2. Enter your OMDB API key and click "Save"

![OMDB API Key Entry](screenshots/popup-api-key.png)

3. Customize your rating color ranges (optional)

![Customize Rating Color Ranges](screenshots/popup-color-ranges.png)

4. Click "Save Ranges" to apply changes

### 3. Start Browsing
- Visit any movie/TV show page on supported platforms
- Ratings will automatically appear with your custom colors

## 🎨 Default Color Schemes

### IMDB Ratings
- **8.0-10.0**: Green (#28cd41) - Excellent
- **6.6-7.9**: Blue (#86c5e8) - Good
- **4.5-6.5**: Yellow (#ffff54) - Average
- **0.0-4.4**: Red (#ff0000) - Poor

### Rotten Tomatoes
- **80-100**: Green (#28cd41) - Fresh
- **66-79**: Blue (#86c5e8) - Mostly Fresh
- **45-65**: Yellow (#ffff54) - Mixed
- **0-44**: Red (#ff0000) - Rotten

## 🔧 Customization

### Adding Custom Ranges
1. Open the extension popup
2. Click "Add IMDB Range" or "Add RT Range"
3. Set your min/max values
4. Choose your preferred color
5. Click "Save Ranges"

### Color Range Rules
- **Maximum 5 ranges** per rating type
- **No overlapping ranges** allowed
- **IMDB**: 0.0 to 10.0 (supports decimals)
- **RT**: 0 to 100 (integers only)
- **Valid hex colors** required

## 🌐 Supported Platforms

- **Disney+ Hotstar**
- **Netflix**
- **Amazon Prime Video**
- **Hulu**
- **Apple TV+**
- **Zee5**
- **Sony LIV**
- **JioCinema**
- **MX Player**
- **Crunchyroll**



## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OMDB API** for providing comprehensive movie data

## 📞 Support

If you encounter any issues or have feature requests:
1. Check the [Issues](https://github.com/yourusername/hotstar-ratings/issues) page
2. Create a new issue with detailed description
3. Include browser version and extension version

---

