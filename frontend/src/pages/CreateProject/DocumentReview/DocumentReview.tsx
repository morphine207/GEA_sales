import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Button, Spin, Tooltip, Slider } from 'antd';
import { 
  BorderOutlined, 
  DeleteOutlined, 
  UndoOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  FullscreenOutlined
} from '@ant-design/icons';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import { useFileStore } from '../../../store/file.store';

interface SelectionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DocumentReview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageLoadedRef = useRef<boolean>(false);

  const [isDrawMode, setIsDrawMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [selections, setSelections] = useState<SelectionBox[]>([]);
  const [currentSelection, setCurrentSelection] = useState<SelectionBox | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const { project, fileImageBlobUrl, loadFileImage, loading, createdScannedFileRegions } = useFileStore();

  const getScannedFile = useMemo(() => {
    const file = project?.files?.[0];
    if(!file) return;
    return file.scanned_files.find(sf => file.files_to_scan.length > 0 && sf.page_number == file.files_to_scan[0])
  }, [project?.files]);

  useEffect(() => {
    if (imageLoadedRef.current) return;
    
    const file = project?.files?.[0];
    const fileId = file?.id;
    const projectId = project?.id;

    const scannedFile = file?.scanned_files.find(sf => file.files_to_scan.length > 0 && sf.page_number == file.files_to_scan[0])
    const scannedFileId = scannedFile?.id;

    if(!fileId || !projectId || !scannedFileId) {
      throw new Error("existing ids are not defined");
    }
  
    if (!fileImageBlobUrl) {
      loadFileImage(fileId, scannedFileId as number, projectId, 'original');
    }

    if(scannedFile.file_regions.length > 0) {
      setSelections(
        scannedFile.file_regions.map(region => {
          const { x_min, x_max, y_min, y_max } = region;
          return {
            id: "preset",
            x: x_min,
            y: y_min,
            width: x_max - x_min,
            height: y_max - y_min
          } as SelectionBox
        })
      ); 
    }
  }, [project?.files?.[0]?.id, project?.id]);

  useEffect(() => {
    if (fileImageBlobUrl && !imageLoadedRef.current) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImage(img);
        setOriginalImageSize({ width: img.width, height: img.height });
        imageLoadedRef.current = true;
      };
      img.src = fileImageBlobUrl;
    }
  }, [fileImageBlobUrl]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current || !originalImageSize.width || !originalImageSize.height) return;
      setStageSize({
        width: originalImageSize.width * zoomLevel,
        height: originalImageSize.height * zoomLevel
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [zoomLevel, originalImageSize]);

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const handleZoomIn = () => handleZoomChange(Math.min(zoomLevel + 0.1, 2));
  const handleZoomOut = () => handleZoomChange(Math.max(zoomLevel - 0.1, 0.1));

  const handleMouseDown = () => {
    if (!isDrawMode) return;
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    const scale = 1 / zoomLevel;
    const scaledX = pointerPos.x * scale;
    const scaledY = pointerPos.y * scale;
    setIsDrawing(true);
    setStartPoint({ x: scaledX, y: scaledY });
    setCurrentSelection({
      id: `box_${Date.now()}`,
      x: scaledX,
      y: scaledY,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = () => {
    if (!isDrawing || !isDrawMode || !currentSelection) return;
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    const scale = 1 / zoomLevel;
    const scaledX = pointerPos.x * scale;
    const scaledY = pointerPos.y * scale;
    const width = scaledX - startPoint.x;
    const height = scaledY - startPoint.y;
    setCurrentSelection({
      ...currentSelection,
      x: width < 0 ? startPoint.x + width : startPoint.x,
      y: height < 0 ? startPoint.y + height : startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentSelection) return;
    if (currentSelection.width > 5 && currentSelection.height > 5) {
      setSelections([...selections, currentSelection]);
    }
    setIsDrawing(false);
    setCurrentSelection(null);
  };

  const handleUndo = () => {
    if (selections.length > 0) {
      const presets = selections.filter(sel => sel.id === "preset");
      const nonPresets = selections.filter(sel => sel.id !== "preset");
      setSelections([...presets, ...nonPresets.slice(0,-1)]);
    }
  };

  const handleClearAll = () => {
    setSelections(selections.filter(x => x.id === "preset"))
  };

  const handleSave = async () => {
    const projectId = project?.id;
    const fileId = project?.files?.[0]?.id;
    const scannedFileId = getScannedFile?.id;

    if(!projectId || !fileId || !scannedFileId) {
      throw new Error("ids are not defined.");
    }

    const nonPresetSelections = selections.filter(sel => sel.id !== "preset");
    if(nonPresetSelections.length == 0) return;


    const jsonSelections = nonPresetSelections.map(selection => {
      const { x, y, width, height } = selection; 
      return ({
        xMin: x, 
        yMin: y,
        xMax: x + width, 
        yMax: y + height
      });
    });

    createdScannedFileRegions(projectId as number, fileId as number, scannedFileId as number, 'medium', jsonSelections);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!isFullscreen) {
      if (container.requestFullscreen) container.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-none p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tooltip title={isDrawMode ? 'Drawing Mode Active' : 'Enable Drawing Mode'}>
              <Button
                type={isDrawMode ? 'primary' : 'default'}
                icon={<BorderOutlined />}
                onClick={() => setIsDrawMode(!isDrawMode)}
              >
                Draw Box
              </Button>
            </Tooltip>
            <Tooltip title="Undo Last Box">
              <Button icon={<UndoOutlined />} onClick={handleUndo} disabled={selections.length === 0} />
            </Tooltip>
            <Tooltip title="Clear All Boxes">
              <Button icon={<DeleteOutlined />} onClick={handleClearAll} disabled={selections.length === 0} />
            </Tooltip>
            <div className="h-6 border-l border-gray-300 mx-2" />
            <Tooltip title="Zoom Out">
              <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={zoomLevel <= 0.5} />
            </Tooltip>
            <div className="w-32">
              <Slider min={0.1} max={2} step={0.1} value={zoomLevel} onChange={handleZoomChange} />
            </div>
            <Tooltip title="Zoom In">
              <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={zoomLevel >= 2} />
            </Tooltip>
            <div className="h-6 border-l border-gray-300 mx-2" />
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
              <Button icon={<FullscreenOutlined />} onClick={toggleFullscreen} />
            </Tooltip>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Spin size="large" />
          </div>
        )}
        <div className="min-h-full flex items-start justify-start p-4">
          {image && stageSize.width > 0 && stageSize.height > 0 && (
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              style={{ cursor: isDrawMode ? 'crosshair' : 'default' }}
              scale={{ x: zoomLevel, y: zoomLevel }}
            >
              <Layer>
                <KonvaImage 
                image={image} 
                width={originalImageSize.width} 
                height={originalImageSize.height} />
              </Layer>
              <Layer>
                {selections.map((box, index) => (
                  <Rect
                    key={box.id + index}
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    stroke="#ff0000"
                    strokeWidth={2 / zoomLevel}
                    fill="transparent"
                  />
                ))}
                {currentSelection && (
                  <Rect
                    x={currentSelection.x}
                    y={currentSelection.y}
                    width={currentSelection.width}
                    height={currentSelection.height}
                    stroke="#ff0000"
                    strokeWidth={2 / zoomLevel}
                    fill="transparent"
                    dash={[5, 5]}
                  />
                )}
              </Layer>
            </Stage>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Button onClick={handleSave} disabled={loading}>
          Save
        </Button>
      </div>
    </div>
  );
};
