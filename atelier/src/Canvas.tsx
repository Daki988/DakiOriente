import { useEffect, useRef, useState, type RefObject } from "react";
import { Stage, Layer, Rect, Ellipse, Text, Line, Image as KImage, Transformer } from "react-konva";
import Konva from "konva";
import type { Doc, Shape, ImageShape, LineShape, Tool } from "./types";
import { uid } from "./types";

interface Props {
  doc: Doc;
  scale: number;
  tool: Tool;
  brush: { color: string; size: number };
  selectedId: string | null;
  stageRef: RefObject<Konva.Stage | null>;
  onSelect: (id: string | null) => void;
  onChangeShape: (id: string, patch: Partial<Shape>) => void;
  onAdd: (s: Shape) => void;
  onPlace: (x: number, y: number) => void;
  onEditText: () => void;
}

/** Image avec retouches (luminosité, contraste…) appliquées par les filtres Konva. */
function FilteredImage({ shape, common }: { shape: ImageShape; common: Record<string, unknown> }) {
  const ref = useRef<Konva.Image>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const i = new window.Image();
    i.onload = () => setImg(i);
    i.src = shape.src;
  }, [shape.src]);

  const f = shape.filters;
  const filters = [Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL, Konva.Filters.Blur];
  if (f.grayscale) filters.push(Konva.Filters.Grayscale);

  useEffect(() => {
    const node = ref.current;
    if (!node || !img) return;
    node.cache({ pixelRatio: 1 });
    node.getLayer()?.batchDraw();
  }, [img, f.brightness, f.contrast, f.saturation, f.blur, f.grayscale, shape.width, shape.height]);

  return (
    <KImage
      ref={ref}
      image={img ?? undefined}
      width={shape.width}
      height={shape.height}
      filters={filters}
      brightness={f.brightness / 100}
      contrast={f.contrast}
      saturation={f.saturation / 100}
      blurRadius={f.blur}
      {...common}
    />
  );
}

export default function Canvas(p: Props) {
  const { doc, scale, tool } = p;
  const trRef = useRef<Konva.Transformer>(null);
  const [drawing, setDrawing] = useState<LineShape | null>(null);

  // Attache les poignées de redimensionnement à l'élément sélectionné.
  useEffect(() => {
    const tr = trRef.current;
    const stage = p.stageRef.current;
    if (!tr || !stage) return;
    const node = p.selectedId && tool === "select" ? stage.findOne("#" + p.selectedId) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [p.selectedId, doc, tool, p.stageRef]);

  const pointer = () => {
    const pos = p.stageRef.current!.getPointerPosition()!;
    return { x: pos.x / scale, y: pos.y / scale };
  };

  function onDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const onEmpty = e.target === e.target.getStage() || e.target.name() === "page";
    if (tool === "brush") {
      const { x, y } = pointer();
      setDrawing({
        id: uid(),
        type: "line",
        name: "Trait",
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        visible: true,
        points: [x, y, x + 0.1, y + 0.1],
        stroke: p.brush.color,
        strokeWidth: p.brush.size,
      });
      return;
    }
    if (tool === "text" || tool === "rect" || tool === "ellipse") {
      const { x, y } = pointer();
      p.onPlace(x, y);
      return;
    }
    if (onEmpty) p.onSelect(null);
  }

  function onMove() {
    if (!drawing) return;
    const { x, y } = pointer();
    setDrawing({ ...drawing, points: [...drawing.points, x, y] });
  }

  function onUp() {
    if (drawing) {
      p.onAdd(drawing);
      setDrawing(null);
    }
  }

  function onTransformEnd(s: Shape, node: Konva.Node) {
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const pos = { x: node.x(), y: node.y(), rotation: node.rotation() };
    switch (s.type) {
      case "text":
        return p.onChangeShape(s.id, { ...pos, width: Math.max(20, s.width * sx), fontSize: Math.max(4, Math.round(s.fontSize * sy)) });
      case "rect":
      case "image":
        return p.onChangeShape(s.id, { ...pos, width: Math.max(4, s.width * sx), height: Math.max(4, s.height * sy) });
      case "ellipse":
        return p.onChangeShape(s.id, { ...pos, radiusX: Math.max(2, s.radiusX * sx), radiusY: Math.max(2, s.radiusY * sy) });
      case "line":
        return p.onChangeShape(s.id, { ...pos, points: s.points.map((v, i) => (i % 2 ? v * sy : v * sx)) });
    }
  }

  function render(s: Shape) {
    const common = {
      id: s.id,
      key: s.id,
      x: s.x,
      y: s.y,
      rotation: s.rotation,
      opacity: s.opacity,
      visible: s.visible,
      draggable: tool === "select",
      onMouseDown: () => tool === "select" && p.onSelect(s.id),
      onTouchStart: () => tool === "select" && p.onSelect(s.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => p.onChangeShape(s.id, { x: e.target.x(), y: e.target.y() }),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(s, e.target),
    };
    switch (s.type) {
      case "text":
        return (
          <Text
            {...common}
            text={s.text}
            fontSize={s.fontSize}
            fontFamily={s.fontFamily}
            fontStyle={s.fontStyle}
            fill={s.fill}
            align={s.align}
            width={s.width}
            letterSpacing={s.letterSpacing}
            lineHeight={1.1}
            onDblClick={p.onEditText}
            onDblTap={p.onEditText}
          />
        );
      case "rect":
        return <Rect {...common} width={s.width} height={s.height} fill={s.fill} cornerRadius={s.cornerRadius} />;
      case "ellipse":
        return <Ellipse {...common} radiusX={s.radiusX} radiusY={s.radiusY} fill={s.fill} />;
      case "line":
        return <Line {...common} points={s.points} stroke={s.stroke} strokeWidth={s.strokeWidth} tension={0.4} lineCap="round" lineJoin="round" hitStrokeWidth={Math.max(12, s.strokeWidth)} />;
      case "image": {
        const { key, ...rest } = common;
        return <FilteredImage key={key} shape={s} common={rest} />;
      }
    }
  }

  const bg = doc.background;
  return (
    <Stage
      ref={p.stageRef}
      width={doc.width * scale}
      height={doc.height * scale}
      scaleX={scale}
      scaleY={scale}
      onMouseDown={onDown}
      onTouchStart={onDown}
      onMouseMove={onMove}
      onTouchMove={onMove}
      onMouseUp={onUp}
      onTouchEnd={onUp}
      style={{ cursor: tool === "select" ? "default" : "crosshair" }}
    >
      <Layer>
        <Rect
          name="page"
          width={doc.width}
          height={doc.height}
          {...(bg.kind === "color"
            ? { fill: bg.color }
            : {
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: doc.width, y: doc.height },
                fillLinearGradientColorStops: [0, bg.from, 1, bg.to],
              })}
        />
        {doc.shapes.map(render)}
        {drawing && render(drawing)}
        <Transformer
          ref={trRef}
          name="transformer"
          rotationSnaps={[0, 90, 180, 270]}
          anchorSize={10}
          anchorCornerRadius={5}
          borderStroke="#39b6ff"
          anchorStroke="#39b6ff"
          ignoreStroke
          boundBoxFunc={(o, n) => (n.width < 5 || n.height < 5 ? o : n)}
        />
      </Layer>
    </Stage>
  );
}

/** Exporte la page à sa taille réelle, sans les poignées de sélection. */
export function exportPage(stage: Konva.Stage, scale: number, mime: "image/png" | "image/jpeg", ratio = 1): string {
  const tr = stage.findOne(".transformer");
  tr?.visible(false);
  const url = stage.toDataURL({ mimeType: mime, quality: 0.92, pixelRatio: ratio / scale });
  tr?.visible(true);
  return url;
}
