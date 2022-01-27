/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SharedString } from "fluid-framework";
import { TinyliciousClient } from "@fluidframework/tinylicious-client";

// Load container and render the app

const client = new TinyliciousClient();
const containerSchema = {
    initialObjects: {diceString : SharedString}
};
const root = document.getElementById("content");

const createNewDice = async () => {
    const { container } = await client.createContainer(containerSchema);
    container.initialObjects.diceString.insertText(0, "Hello World!");
    const id = await container.attach();
    renderDiceRoller(container.initialObjects.diceString, root);
    return id;
}

const loadExistingDice = async (id) => {
    const { container } = await client.getContainer(id, containerSchema);
    renderDiceRoller(container.initialObjects.diceString, root);
}

async function start() {
    if (location.hash) {
        await loadExistingDice(location.hash.substring(1))
    } else {
        const id = await createNewDice();
        location.hash = id;
    }
}

start().catch((error) => console.error(error));


// Define the view

const template = document.createElement("template");

template.innerHTML = `
  <style>
    .wrapper { text-align: center }
  </style>
  <div class="wrapper">
    <button class="roll"> Roll </button>
    <div class="dice"></div>    
  </div>
`

const renderDiceRoller = (diceString, elem) => {
    elem.appendChild(template.content.cloneNode(true));

    const rollButton = elem.querySelector(".roll");
    const dice = elem.querySelector(".dice");

    rollButton.onclick = () => 
	{
        const len = diceString.getText().length;
		switch(Math.floor(Math.random() * 2))
		{
			case 0:
                const insertStart = Math.floor(Math.random() * len);
                const insertLen = Math.floor(Math.random() * 32);
                var insertText = "";
                for(var i=0;i<insertLen;i++)
                {
                    insertText += String.fromCharCode(32 + Math.floor(Math.random() * 96));
                }
				diceString.insertText(insertStart, insertText);
				break;
			case 1:
                const removeStart = Math.floor(Math.random() * len);
                const removeLen = 1 + Math.floor(Math.random() * (len - removeStart - 1));
				diceString.removeText(removeStart, removeStart+removeLen);
				break;
		}		
	}

    // Get the current value of the shared data to update the view whenever it changes.
    const updateDice = () => {
        const diceValue = diceString.getText();
        dice.textContent = diceValue;
    };
    updateDice();

    // Use the changed event to trigger the rerender whenever the value changes.
    diceString.on("sequenceDelta", updateDice);
}