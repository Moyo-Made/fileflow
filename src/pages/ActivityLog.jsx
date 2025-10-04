import { useState, useEffect } from "react";

const { ipcRenderer } = window.require("electron");

function ActivityLog() {
	const [events, setEvents] = useState([]);
	const [isWatching, setIsWatching] = useState(false);
	const [watchPath, setWatchPath] = useState("");
	const [ruleActions, setRuleActions] = useState([]);
	const [completedActions, setCompletedActions] = useState([]);

	useEffect(() => {
		ipcRenderer.invoke("get-watch-status").then((status) => {
			setIsWatching(status.isWatching);
			setWatchPath(status.watchPath);
		});
		// Listen for file events
		const handleFileEvent = (event, fileInfo) => {
			setEvents((prev) => [fileInfo, ...prev].slice(0, 50)); // Keep last 50 events
		};

		// Listen for rule actions
		const handleRuleAction = (event, action) => {
			setRuleActions((prev) => [action, ...prev].slice(0, 50));
		};

		const handleActionCompleted = (event, logEntry) => {
			setCompletedActions((prev) => [logEntry, ...prev].slice(0, 50));
		};

		ipcRenderer.on("file-event", handleFileEvent);
		ipcRenderer.on("rule-action", handleRuleAction);
		ipcRenderer.on("action-completed", handleActionCompleted);

		return () => {
			ipcRenderer.removeListener("file-event", handleFileEvent);
			ipcRenderer.removeListener("rule-action", handleRuleAction);
			ipcRenderer.removeListener("action-completed", handleActionCompleted);
		};
	}, []);

	const startWatching = async () => {
		const result = await ipcRenderer.invoke("start-watching", watchPath);
		if (result.success) {
			setIsWatching(true);
			setWatchPath(result.path);
		}
	};

	const stopWatching = async () => {
		await ipcRenderer.invoke("stop-watching");
		setIsWatching(false);
	};

	const getEventEmoji = (type) => {
		switch (type) {
			case "added":
				return "✅";
			case "changed":
				return "📝";
			case "removed":
				return "🗑️";
			default:
				return "📄";
		}
	};

	const getEventColor = (type) => {
		switch (type) {
			case "added":
				return "#48bb78";
			case "changed":
				return "#ed8936";
			case "removed":
				return "#f56565";
			default:
				return "#4a5568";
		}
	};

	return (
		<div>
			<h1>Activity Log</h1>
			<p style={{ marginBottom: "20px" }}>Real-time file system monitoring</p>

			{/* Control Panel */}
			<div
				style={{
					padding: "20px",
					background: "white",
					borderRadius: "8px",
					marginBottom: "20px",
				}}
			>
				<div style={{ marginBottom: "15px" }}>
					<strong>Watching:</strong> {watchPath || "Not set"}
				</div>

				<button
					onClick={isWatching ? stopWatching : startWatching}
					style={{
						padding: "10px 20px",
						background: isWatching ? "#f56565" : "#48bb78",
						color: "white",
						border: "none",
						borderRadius: "6px",
						cursor: "pointer",
						fontWeight: "bold",
					}}
				>
					{isWatching ? "⏹️ Stop Watching" : "▶️ Start Watching"}
				</button>

				{isWatching && (
					<span
						style={{
							marginLeft: "15px",
							color: "#48bb78",
							fontWeight: "bold",
						}}
					>
						● Live
					</span>
				)}
			</div>

			{/* Events List */}
			<div
				style={{
					padding: "20px",
					background: "white",
					borderRadius: "8px",
				}}
			>
				<h3 style={{ marginBottom: "15px", fontSize: "18px" }}>
					Recent Events ({events.length})
				</h3>

				{events.length === 0 ? (
					<p style={{ color: "#a0aec0" }}>
						{isWatching
							? "Waiting for file events..."
							: "Start watching to see events"}
					</p>
				) : (
					<div
						style={{ display: "flex", flexDirection: "column", gap: "10px" }}
					>
						{events.map((event, index) => (
							<div
								key={index}
								style={{
									padding: "12px",
									background: "#f7fafc",
									borderLeft: `4px solid ${getEventColor(event.type)}`,
									borderRadius: "4px",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<div>
									<span style={{ marginRight: "8px" }}>
										{getEventEmoji(event.type)}
									</span>
									<strong>{event.name}</strong>
									<span
										style={{
											marginLeft: "10px",
											padding: "2px 8px",
											background: getEventColor(event.type),
											color: "white",
											borderRadius: "4px",
											fontSize: "12px",
										}}
									>
										{event.type}
									</span>
								</div>
								<div style={{ fontSize: "12px", color: "#718096" }}>
									{new Date(event.timestamp).toLocaleTimeString()}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Rule Actions */}
			{ruleActions.length > 0 && (
				<div
					style={{
						padding: "20px",
						background: "white",
						borderRadius: "8px",
						marginTop: "20px",
					}}
				>
					<h3
						style={{ marginBottom: "15px", fontSize: "18px", color: "#667eea" }}
					>
						🎯 Rule Matches ({ruleActions.length})
					</h3>
					<div
						style={{ display: "flex", flexDirection: "column", gap: "10px" }}
					>
						{ruleActions.map((action, index) => (
							<div
								key={index}
								style={{
									padding: "12px",
									background: "#f0f4ff",
									borderLeft: "4px solid #667eea",
									borderRadius: "4px",
								}}
							>
								<div style={{ marginBottom: "5px" }}>
									<strong>{action.rule.name}</strong> matched{" "}
									<strong>{action.fileInfo.name}</strong>
								</div>
								<div style={{ fontSize: "12px", color: "#718096" }}>
									📁 Would move to: {action.action.target}
								</div>
								<div
									style={{
										fontSize: "12px",
										color: "#718096",
										marginTop: "5px",
									}}
								>
									{new Date(action.timestamp).toLocaleString()}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Completed Actions */}
			{completedActions.length > 0 && (
				<div
					style={{
						padding: "20px",
						background: "white",
						borderRadius: "8px",
						marginTop: "20px",
					}}
				>
					<h3
						style={{ marginBottom: "15px", fontSize: "18px", color: "#48bb78" }}
					>
						✅ Completed Actions ({completedActions.length})
					</h3>
					<div
						style={{ display: "flex", flexDirection: "column", gap: "10px" }}
					>
						{completedActions.map((log) => (
							<div
								key={log.id}
								style={{
									padding: "12px",
									background: log.success ? "#f0fff4" : "#fff5f5",
									borderLeft: `4px solid ${log.success ? "#48bb78" : "#f56565"}`,
									borderRadius: "4px",
								}}
							>
								<div style={{ marginBottom: "5px" }}>
									{log.success ? "✅" : "❌"} <strong>{log.fileName}</strong>
									{log.renamed && (
										<span style={{ color: "#ed8936", marginLeft: "5px" }}>
											→ {log.newName}
										</span>
									)}
								</div>
								<div style={{ fontSize: "12px", color: "#718096" }}>
									📁 Moved to: {log.targetPath}
								</div>
								<div
									style={{
										fontSize: "12px",
										color: "#718096",
										marginTop: "3px",
									}}
								>
									🎯 Rule: {log.ruleName}
								</div>
								{log.error && (
									<div
										style={{
											fontSize: "12px",
											color: "#f56565",
											marginTop: "3px",
										}}
									>
										⚠️ Error: {log.error}
									</div>
								)}
								<div
									style={{
										fontSize: "11px",
										color: "#a0aec0",
										marginTop: "5px",
									}}
								>
									{new Date(log.timestamp).toLocaleString()}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default ActivityLog;
