import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background, Controls, MiniMap, useNodesState, useEdgesState,
  Handle, Position, type NodeProps, type Node, type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { archNodes, archEdges, nodeColors, type NodeKind } from "@/lib/mock-data";
import { Database, Server, Boxes, Zap, Cpu, GitBranch, Sparkles } from "lucide-react";

const iconFor: Record<NodeKind, React.ComponentType<{ className?: string }>> = {
  repo: GitBranch, service: Server, module: Boxes, api: Zap, database: Database, infra: Cpu, ai: Sparkles,
};

function AtlasNode({ data, selected }: NodeProps<{ label: string; sub: string; kind: NodeKind }>) {
  const c = nodeColors[data.kind];
  const Icon = iconFor[data.kind];
  return (
    <div
      className={`group relative min-w-[180px] rounded-xl border border-border/70 bg-card/95 backdrop-blur px-3 py-2.5 text-left transition-all ${
        selected ? "ring-2 ring-primary/70 border-primary/50" : "hover:border-border"
      }`}
      style={{ boxShadow: "0 8px 30px -12px rgba(0,0,0,0.5)" }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-none !bg-border" />
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.bg} ring-1 ring-inset ${c.ring}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium">{data.label}</div>
          <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{c.label} · {data.sub}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-none !bg-border" />
    </div>
  );
}

const nodeTypes = { atlas: AtlasNode };

export function ArchitectureGraph({ onSelect }: { onSelect?: (id: string | null) => void }) {
  const initialNodes: Node[] = useMemo(
    () => archNodes.map((n) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: n.label, sub: n.sub, kind: n.kind },
      type: "atlas",
    })),
    [],
  );
  const initialEdges: Edge[] = useMemo(
    () => archEdges.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      animated: e.animated,
      style: { stroke: e.animated ? "var(--primary)" : "color-mix(in oklab, white 25%, transparent)", strokeWidth: 1.5 },
    })),
    [],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleSelect = useCallback((_: unknown, node: Node) => onSelect?.(node.id), [onSelect]);
  const handlePane = useCallback(() => onSelect?.(null), [onSelect]);

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      onNodeClick={handleSelect} onPaneClick={handlePane}
      nodeTypes={nodeTypes} fitView
      minZoom={0.4} maxZoom={1.75}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} size={1} color="color-mix(in oklab, white 8%, transparent)" />
      <MiniMap pannable zoomable maskColor="rgba(9,9,11,0.7)" nodeColor={(n) => {
        const kind = (n.data as { kind: NodeKind }).kind;
        const map: Record<NodeKind, string> = {
          repo: "#3b82f6", service: "#a855f7", module: "#6366f1", api: "#22c55e", database: "#f59e0b", infra: "#64748b", ai: "#ec4899",
        };
        return map[kind];
      }} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
