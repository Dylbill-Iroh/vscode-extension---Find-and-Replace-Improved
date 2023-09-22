import * as vscode from 'vscode';

//var outputChannel: vscode.//outputChannel;
var searchText = "";
var replaceText = "";

export function activate(context: vscode.ExtensionContext) {

	// if (outputChannel === undefined){
	// 	outputChannel = vscode.window.createoutputChannel("Find And Replace Improved");
	// }

	let findAndReplaceFuction = vscode.commands.registerCommand('find-and-replace---improved.findAndReplace', () => {
		findAndReplace();
	});

	let toggleCaseSensitiveFunction = vscode.commands.registerCommand('find-and-replace---improved.toggleCaseSensitive', () => {
		toggleCaseSensitive();
	});

	let toggleWholeWordFunction = vscode.commands.registerCommand('find-and-replace---improved.toggleWholeWord', () => {
		toggleWholeWord();
	});

	context.subscriptions.push(findAndReplaceFuction);
	context.subscriptions.push(toggleCaseSensitiveFunction);
	context.subscriptions.push(toggleWholeWordFunction);
}

export function deactivate() {

}

export function toggleCaseSensitive(){
	let textEditor = vscode.window.activeTextEditor;

    if (textEditor !== undefined){
        let settingType = vscode.ConfigurationTarget.Global;

        let config = vscode.workspace.getConfiguration('FindAndReplaceImproved');
		let caseSensitive:boolean = vscode.workspace.getConfiguration('FindAndReplaceImproved').CaseSensitive;
		//outputChannel.appendLine("caseSensitive is " + caseSensitive);
		//outputChannel.show();

		caseSensitive = !caseSensitive;
        try {
            config.update('CaseSensitive', caseSensitive, settingType);
        } catch (e: any){
            showNotification('failed to toggle case sensitive');
        } finally {
            showNotification("Case Sensitive is " + caseSensitive);
        }

    } else {
        showNotification("No open file found. Open a file to set pex output folder to the file's location");
    }
}

export function toggleWholeWord(){
	let textEditor = vscode.window.activeTextEditor;

    if (textEditor !== undefined){
        let settingType = vscode.ConfigurationTarget.Global;

        let config = vscode.workspace.getConfiguration('FindAndReplaceImproved');
		let wholeWordsOnly:boolean = vscode.workspace.getConfiguration('FindAndReplaceImproved').WholeWord;
		//outputChannel.appendLine("Whole Words Only is " + wholeWordsOnly);
		//outputChannel.show();

		wholeWordsOnly = !wholeWordsOnly;

        try {
            config.update('WholeWord', wholeWordsOnly, settingType);
        } catch (e: any){
            showNotification('failed to toggle whole word.');
        } finally {
            showNotification("Whole Words Only is " + wholeWordsOnly);
        }

    } else {
        showNotification("No open file found. Open a file to set pex output folder to the file's location");
    }
}

export function findAndReplace() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		let selectedSearchText = getSearchTextFromSelection(editor);
		if (selectedSearchText !== undefined && selectedSearchText !== ""){
			searchText = selectedSearchText;
		}
		vscode.window.showInputBox({
		prompt: "Enter Search Text",
		value: searchText,
		}).then(sText => {
			if (sText !== undefined && sText !== ""){
				searchText = sText; 
				vscode.window.showInputBox({
				prompt: "Enter Replace Text",
				value: replaceText,
				}).then(rText => {
					if (rText !== undefined){
						replaceText = rText; 
						let caseSensitive = vscode.workspace.getConfiguration('FindAndReplaceImproved').CaseSensitive;
						let wholeWordsOnly = vscode.workspace.getConfiguration('FindAndReplaceImproved').WholeWord;
						//outputChannel.appendLine("");
						//outputChannel.appendLine("replacing " + searchText + " with " + replaceText);
						//outputChannel.appendLine("caseSensitive = " + caseSensitive);
						//outputChannel.appendLine("wholeWordsOnly = " + wholeWordsOnly);
						//outputChannel.show();

						const selections = editor.selections; 
						const document = editor.document;
						
						if (selections.length > 1){
							//outputChannel.appendLine("multiple selections");
							//outputChannel.show();
							let selectedStrings: string[] = [];

							for (let i = 0; i < selections.length; i++){
								let currentSelectionText = replaceInSelection(searchText, replaceText, editor, selections[i], document, false, wholeWordsOnly, caseSensitive);
								if (currentSelectionText === undefined){
									selectedStrings.push("");
								} else {
									selectedStrings.push(currentSelectionText);
								}
							}
							editor.edit(builder => {
								for(let i = 0; i < selections.length; i++){
									builder.replace(selections[i], selectedStrings[i]);
								}
							});
						} else {
							const selection = editor.selection; 
							let selectedText = replaceInSelection(searchText, replaceText, editor, selection, document, true, wholeWordsOnly, caseSensitive);
							
							if (selection && !selection.isEmpty){
								editor.edit(builder => {
									builder.replace(selection, selectedText);
								});
								//outputChannel.appendLine("single selection");
								//outputChannel.show();
							} else {
								editor.edit(builder => {
									builder.replace(new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end), selectedText);
								});
								//outputChannel.appendLine("entire document");
								//outputChannel.show();
							}
						}
					} 
				});
			} 
		});
	}
}

export function replaceInSelection(searchString:string, replaceString:string, editor:vscode.TextEditor, selection:vscode.Selection, document:vscode.TextDocument, allowEntireDocument:boolean, matchWholeWord:boolean, matchCase:boolean){
	let selectedText = ""; 

	if (selection && !selection.isEmpty) {
		selectedText = document.getText(selection);
	} else if(allowEntireDocument){
		selectedText = document.getText();
	}
	
	if (selectedText === undefined){
		selectedText = "";
	} 

	if (searchString === undefined || searchString === "" || selectedText === ""){
		return selectedText;
	} 

	if (replaceString === undefined){
		replaceString = "";
	}

	let searchText = selectedText; 

	if (!matchCase){
		searchText = searchText.toLocaleLowerCase();
		searchString = searchString.toLocaleLowerCase();
	} 

	let index:number = searchText.indexOf(searchString, 0);

	if (matchWholeWord){
		while (index !== -1){
			let endIndex = index + searchString.length;
			if (index > 0){ 
				if (isCharLetter(searchText.charAt(index - 1))){ //not whole word, skip
					index = searchText.indexOf(searchString, endIndex);
					continue;
				}
			} 
			if (endIndex < searchText.length){
				if (isCharLetter(searchText.charAt(endIndex))){ //not whole word, skip
					index = searchText.indexOf(searchString, endIndex);
					continue;
				}
			}
			searchText = searchText.substring(0, index) + replaceString + searchText.substring(endIndex);
			selectedText = selectedText.substring(0, index) + replaceString + selectedText.substring(endIndex);
			index = searchText.indexOf(searchString, endIndex);
		}
	} else {
		while (index !== -1){
			let endIndex = index + searchString.length;
			searchText = searchText.substring(0, index) + replaceString + searchText.substring(endIndex);
			selectedText = selectedText.substring(0, index) + replaceString + selectedText.substring(endIndex);
			index = searchText.indexOf(searchString, endIndex);
		}
	}

	// //outputChannel.appendLine(selectedText);
	// //outputChannel.show();

	////outputChannel.appendLine(selectedText);
	////outputChannel.show();

	return selectedText;
} 

export function getSearchTextFromSelection(editor:vscode.TextEditor) {
	const selections = editor.selections; 
	let sText = "";

	if (selections.length > 1){
		return sText;
	}

	const document = editor.document;
	const selection = editor.selection; 
	
	let selectedText = document.getText(selection);
	if (selectedText !== undefined){
		sText = selectedText;
		if (sText.indexOf("\n") !== -1){
			sText = "";
		}
	}
	return sText;
}

export function isCharLetter(c:string) {
	return (c.toLowerCase() !== c.toUpperCase());
}

export async function showNotification(message: String, timeout: number = 5500) {
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            cancellable: false
        },
        async (progress) => {
            progress.report({ increment: 100, message: `${message}` });
            await new Promise((resolve) => setTimeout(resolve, timeout));
        }
    );
}