import { useState, useEffect } from "react";

const { ipcRenderer } = window.require("electron");

function Settings() {
	const [watchStatus, setWatchStatus] = useState({
		isWatching: false,
		watchPath: "",
	});
	const [appVersion, setAppVersion] = useState("");
	const [statusMessage, setStatusMessage] = useState("");

	// Load initial data
	useEffect(() => {
		loadWatchStatus();
		loadAppVersion();
	}, []);

	const loadWatchStatus = async () => {
		const status = await ipcRenderer.invoke("get-watch-status");
		setWatchStatus(status);
	};

	const loadAppVersion = async () => {
		const version = await ipcRenderer.invoke("get-app-version");
		setAppVersion(version);
	};

	const handleToggleWatching = async () => {
		try {
			if (watchStatus.isWatching) {
				await ipcRenderer.invoke("stop-watching");
				setStatusMessage("✋ File watching stopped");
			} else {
				await ipcRenderer.invoke("start-watching", watchStatus.watchPath);
				setStatusMessage("✅ File watching started");
			}
			loadWatchStatus();

			// Clear message after 3 seconds
			setTimeout(() => setStatusMessage(""), 3000);
		} catch (error) {
			setStatusMessage("❌ Error: " + error.message);
		}
	};

	const handleChangeFolder = async () => {
		const newPath = await ipcRenderer.invoke("select-folder");
		if (newPath) {
			// Warn about risky folders
			const riskyPatterns = [
				"node_modules",
				"fileflow",
				".git",
				"Library",
				"System",
			];
			const isRisky = riskyPatterns.some((pattern) =>
				newPath.includes(pattern)
			);

			if (isRisky) {
				const confirmed = window.confirm(
					"⚠️ WARNING: This folder may contain thousands of files (like node_modules or system files).\n\n" +
						"Watching it could cause:\n" +
						"• App crashes\n" +
						"• High CPU usage\n" +
						"• System slowdown\n\n" +
						"Recommended folders: Downloads, Desktop, or specific work folders.\n\n" +
						"Continue anyway?"
				);
				if (!confirmed) return;
			}

			const result = await ipcRenderer.invoke("change-watch-folder", newPath);
			if (result.success) {
				setStatusMessage(`✅ Now watching: ${newPath}`);
				loadWatchStatus();
				setTimeout(() => setStatusMessage(""), 3000);
			}
		}
	};

	const handleClearLogs = async () => {
		if (window.confirm("Are you sure you want to clear all activity logs?")) {
			await ipcRenderer.invoke("clear-activity-logs");
			setStatusMessage("🗑️ Activity logs cleared");
			setTimeout(() => setStatusMessage(""), 3000);
		}
	};

	return (
		<div>
			<h1>Settings</h1>
			<p style={{ color: "#718096", marginBottom: "30px" }}>
				Configure how FileFlow organizes your files
			</p>

			{/* Status Message */}
			{statusMessage && (
				<div
					style={{
						padding: "12px 20px",
						background: "#e6fffa",
						border: "1px solid #81e6d9",
						borderRadius: "6px",
						marginBottom: "20px",
						color: "#234e52",
					}}
				>
					{statusMessage}
				</div>
			)}

			{/* File Watching Section */}
			<div
				style={{
					padding: "20px",
					background: "white",
					borderRadius: "8px",
					marginBottom: "20px",
				}}
			>
				<h3 style={{ marginBottom: "15px" }}>📁 File Watching</h3>

				<div style={{ marginBottom: "20px" }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "10px",
							marginBottom: "10px",
						}}
					>
						<span style={{ fontWeight: "bold" }}>Status:</span>
						<span
							style={{
								padding: "4px 12px",
								background: watchStatus.isWatching ? "#c6f6d5" : "#fed7d7",
								color: watchStatus.isWatching ? "#22543d" : "#742a2a",
								borderRadius: "12px",
								fontSize: "14px",
								fontWeight: "bold",
							}}
						>
							{watchStatus.isWatching ? "● Active" : "○ Stopped"}
						</span>
					</div>

					<div style={{ marginBottom: "15px" }}>
						<span style={{ fontWeight: "bold" }}>Watching Folder:</span>
						<div
							style={{
								marginTop: "5px",
								padding: "10px",
								background: "#f7fafc",
								border: "1px solid #e2e8f0",
								borderRadius: "4px",
								fontFamily: "monospace",
								fontSize: "14px",
							}}
						>
							{watchStatus.watchPath || "No folder selected"}
						</div>
					</div>

					<div style={{ display: "flex", gap: "10px" }}>
						<button
							onClick={handleToggleWatching}
							style={{
								padding: "10px 20px",
								background: watchStatus.isWatching ? "#f56565" : "#48bb78",
								color: "white",
								border: "none",
								borderRadius: "6px",
								cursor: "pointer",
								fontWeight: "bold",
							}}
						>
							{watchStatus.isWatching
								? "⏸️ Stop Watching"
								: "▶️ Start Watching"}
						</button>

						<button
							onClick={handleChangeFolder}
							style={{
								padding: "10px 20px",
								background: "#667eea",
								color: "white",
								border: "none",
								borderRadius: "6px",
								cursor: "pointer",
								fontWeight: "bold",
							}}
						>
							📁 Change Folder
						</button>
					</div>
				</div>

				<div
					style={{
						padding: "15px",
						background: "#eff6ff",
						border: "1px solid #bfdbfe",
						borderRadius: "6px",
						fontSize: "14px",
						color: "#1e40af",
					}}
				>
					💡 <strong>Tip:</strong> FileFlow automatically watches your Downloads
					folder by default. You can change this to any folder like Desktop,
					Documents, or a custom location.
				</div>
			</div>

			{/* Maintenance Section */}
			<div
				style={{
					padding: "20px",
					background: "white",
					borderRadius: "8px",
					marginBottom: "20px",
				}}
			>
				<h3 style={{ marginBottom: "15px" }}>🛠️ Maintenance</h3>

				<div style={{ marginBottom: "15px" }}>
					<p style={{ marginBottom: "10px", color: "#4a5568" }}>
						Clear all activity logs and start fresh
					</p>
					<button
						onClick={handleClearLogs}
						style={{
							padding: "10px 20px",
							background: "#fc8181",
							color: "white",
							border: "none",
							borderRadius: "6px",
							cursor: "pointer",
							fontWeight: "bold",
						}}
					>
						🗑️ Clear Activity Logs
					</button>
				</div>
			</div>

			{/* About Section */}
			<div
				style={{
					padding: "20px",
					background: "white",
					borderRadius: "8px",
				}}
			>
				<h3 style={{ marginBottom: "15px" }}>ℹ️ About</h3>

				<div style={{ fontSize: "14px", color: "#4a5568", lineHeight: "1.8" }}>
					<div style={{ marginBottom: "8px" }}>
						<strong>FileFlow</strong> - Your intelligent file organizer
					</div>
					<div style={{ marginBottom: "8px" }}>
						Version:{" "}
						<code
							style={{
								background: "#edf2f7",
								padding: "2px 6px",
								borderRadius: "3px",
							}}
						>
							{appVersion || "1.0.0"}
						</code>
					</div>
					<div
						style={{
							marginTop: "15px",
							paddingTop: "15px",
							borderTop: "1px solid #e2e8f0",
						}}
					>
						Made with ❤️ by you
					</div>
				</div>
			</div>
		</div>
	);
}

export default Settings;
