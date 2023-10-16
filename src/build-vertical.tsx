import { TFile, Workspace, WorkspaceSplit } from "obsidian";
import { Settings } from "./get-settings";
import NoteGalleryPlugin from "./main";

import { StrictMode, useState } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";

type ConstructableWorkspaceSplit = new (
	ws: Workspace,
	dir: "horizontal" | "vertical"
) => WorkspaceSplit;

const ReactView = () => {
	const [v, setV] = useState(3);
	return (
		<div>
			<h1>{v}</h1>
			<button onClick={() => setV(v + 1)}>bump up</button>
		</div>
	);
};

const buildVertical = (
	plugin: NoteGalleryPlugin,
	container: HTMLElement,
	filesList: TFile[],
	settings: Settings
) => {
	// inject the gallery wrapper
	// const gallery = container.createDiv("grid-wrapper");
	// gallery.style.lineHeight = "0px";
	// gallery.style.columnCount = `${settings.columns}`;
	// gallery.style.columnGap = `${settings.gutter}px`;

	// // inject and style files
	// filesList.slice(0, 10).forEach((file: TFile) => {
	//   const figure = gallery.createDiv("grid-item");
	//   figure.style.marginBottom = `${settings.gutter}px`;
	//   // figure.style.width = "100%";
	//   figure.style.height = "auto";
	//   figure.style.cursor = "pointer";
	//   figure.setAttribute("data-name", file.name);
	//   figure.setAttribute("data-folder", file.name);

	//   const c = figure.createDiv("grid-content");

	//   const rootSplit: WorkspaceSplit = new (WorkspaceSplit as ConstructableWorkspaceSplit)(
	//     window.app.workspace,
	//     "vertical",
	//   );

	//   plugin.openLink(file, rootSplit, c);
	// });

	const root: Root = createRoot(container);
	root.render(
		<StrictMode>
			<ReactView />
		</StrictMode>
	);

	return root;
};

export default buildVertical;
