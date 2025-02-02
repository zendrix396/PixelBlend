import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas-pro";

function App() {
  // Image objects include: id, file, url, position, dimensions, rotation, filter
  const [images, setImages] = useState([]);
  const [backendMessage, setBackendMessage] = useState("");
  const [layout, setLayout] = useState("freestyle"); // "2x2", "3x3", "freestyle"
  const [background, setBackground] = useState("#ffffff");
  const collageRef = useRef(null);

  useEffect(() => {
    // Check backend connection
    fetch("/ping")
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  // Handle drag and drop file upload
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const id = Date.now() + Math.random();
      setImages((prev) => [
        ...prev,
        {
          id,
          file,
          url,
          x: 10,
          y: 10,
          width: 150,
          height: 150,
          rotation: 0,
          filter: "none",
        },
      ]);
    });
  };

  const updateImage = (id, newProps) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...newProps } : img))
    );
  };

  // Export the collage by capturing the collage area and sending it to the backend
  // ... existing code ...

const handleExport = async () => {
  if (collageRef.current) {
    const canvas = await html2canvas(collageRef.current);
    const dataUrl = canvas.toDataURL("image/png");
    
    try {
      const response = await fetch("/export", {
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'image_data': dataUrl,
          'format': 'png'
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = 'none';
      a.href = url;
      a.download = `collage_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export collage. Please try again.');
    }
  }
};

// ... existing code ...
  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <motion.h1
        className="text-4xl font-bold text-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Image Collage Creator Platform
      </motion.h1>

      <p className="text-center mb-6 text-gray-700">
        Backend says: <strong>{backendMessage || "No response yet"}</strong>
      </p>

      {/* Upload Section */}
      <div className="mb-6 relative">
        <div
          className="border-dashed border-4 border-gray-400 rounded p-6 text-center cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p className="mb-2">Drag and drop images here</p>
          <p>or click to select files</p>
          <input
            type="file"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Layout and Background Options */}
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        <div>
          <label className="mr-2 font-semibold">Layout:</label>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="freestyle">Freestyle</option>
            <option value="2x2">2 x 2 Grid</option>
            <option value="3x3">3 x 3 Grid</option>
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Background:</label>
          <input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="p-1 border rounded"
          />
        </div>
      </div>

      {/* Collage Editor */}
      <div
        ref={collageRef}
        className="relative mx-auto border border-gray-300 bg-white"
        style={{
          width: layout === "2x2" ? 600 : layout === "3x3" ? 900 : 800,
          height: layout === "2x2" ? 600 : layout === "3x3" ? 900 : 600,
          backgroundColor: background,
        }}
      >
        {images.map((img) => (
          <Rnd
            key={img.id}
            size={{ width: img.width, height: img.height }}
            position={{ x: img.x, y: img.y }}
            onDragStop={(e, d) => {
              updateImage(img.id, { x: d.x, y: d.y });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              updateImage(img.id, {
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
                ...position,
              });
            }}
            bounds="parent"
          >
            <div
              style={{
                transform: `rotate(${img.rotation}deg)`,
                filter: img.filter,
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              <img
                src={img.url}
                alt="collage element"
                className="object-cover w-full h-full rounded"
              />
              {/* Controls for rotation and filter */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs flex justify-around p-1">
                <button
                  onClick={() =>
                    updateImage(img.id, { rotation: img.rotation - 15 })
                  }
                  title="Rotate Left"
                >
                  ↺
                </button>
                <button
                  onClick={() =>
                    updateImage(img.id, { rotation: img.rotation + 15 })
                  }
                  title="Rotate Right"
                >
                  ↻
                </button>
                <select
                  value={img.filter}
                  onChange={(e) =>
                    updateImage(img.id, { filter: e.target.value })
                  }
                  className="bg-transparent text-white"
                >
                  <option value="none">Normal</option>
                  <option value="grayscale(100%)">Grayscale</option>
                  <option value="sepia(100%)">Sepia</option>
                  <option value="brightness(150%)">Bright</option>
                </select>
              </div>
            </div>
          </Rnd>
        ))}
      </div>

      {/* Text Overlay Section */}
      <div className="mt-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Add Text Overlay</h2>
        <TextOverlay collageRef={collageRef} />
      </div>

      {/* Export Collage */}
      <div className="mt-6 text-center">
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export Collage
        </button>
      </div>
    </div>
  );
}

// Component for adding text overlay elements to the collage
function TextOverlay({ collageRef }) {
  const [textItems, setTextItems] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [fontSize, setFontSize] = useState(24);
  const [color, setColor] = useState("#000000");

  const addText = () => {
    if (currentText.trim() !== "") {
      const newItem = {
        id: Date.now() + Math.random(),
        text: currentText,
        x: 50,
        y: 50,
        fontSize,
        color,
      };
      setTextItems((prev) => [...prev, newItem]);
      setCurrentText("");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col items-center">
        <input
          type="text"
          placeholder="Enter text"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          className="p-2 border rounded mb-2 w-64"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="p-2 border rounded w-20"
            min="10"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={addText}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Add Text
          </button>
        </div>
      </div>
      {/* Render text overlays as draggable/resizable items */}
      {textItems.map((item) => (
        <Rnd
          key={item.id}
          default={{
            x: item.x,
            y: item.y,
            width: 200,
            height: 50,
          }}
          bounds={collageRef.current || "parent"}
        >
          <div
            style={{
              fontSize: item.fontSize,
              color: item.color,
              background: "rgba(255,255,255,0.5)",
              padding: "4px",
              borderRadius: "4px",
              textAlign: "center",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.text}
          </div>
        </Rnd>
      ))}
    </div>
  );
}

export default App;
