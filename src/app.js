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

var repeat = false;

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

const performRandomOperation = (diceString, count, clientIdText,ops) => {
	
	if (count == 0)
		return;
	
	const len = diceString.getText().length;
	switch(Math.floor(Math.random() * 2))
	{
		case 0:
			const insertStart = Math.floor(Math.random() * len);
			const insertLen = 1 + Math.floor(Math.random() * 31);
			var insertText = "";
			for(var i=0;i<insertLen;i++)
			{
				insertText += String.fromCharCode(97 + Math.floor(Math.random() * 27));
			}		

            diceString.insertText(insertStart, insertText);

			break;
		case 1:
			const removeStart = Math.floor(Math.random() * len);
			const removeLen = 1 + Math.floor(Math.random() * (len - removeStart - 1));
            const removeEnd = removeStart + removeLen;
			
            diceString.removeText(removeStart, removeEnd);

			break;
	}

	setTimeout(() => { performRandomOperation(diceString, count - 1, clientIdText, ops) }, Math.floor(Math.random() * 100));
}

start().catch((error) => console.error(error));


// Define the view

const template = document.createElement("template");

template.innerHTML = `
  <style>
    .wrapper { text-align: center }
  </style>
  <div class="wrapper">    
    <input type="text" class="clientId"></input>
    <input type="text" class="count" value="1"></input>
    <button class="start"> Start </button>
    <button class="stop"> Stop </button>
	<button class="single"> Single </button>
    <button class="reset"> Reset </button>    
    <button class="clear"> Clear </button>
    <div class="dice"></div>
    <br/>
    <div class="ops"></div>
  </div>
`

const renderDiceRoller = (diceString, elem) => {
    elem.appendChild(template.content.cloneNode(true));

    const clientIdText = elem.querySelector(".clientId");
    const countText = elem.querySelector(".count");
    const startButton = elem.querySelector(".start");
    const stopButton = elem.querySelector(".stop");
	const singleButton = elem.querySelector(".single");
    const resetButton = elem.querySelector(".reset");
    const clearButton = elem.querySelector(".clear");
    const dice = elem.querySelector(".dice");
    const ops = elem.querySelector(".ops");

    startButton.onclick = () => 
	{
		repeat = true;
	    performRandomOperation(diceString, parseInt(countText.value), clientIdText,ops);
	}
	
	singleButton.onclick = () => 
	{
		repeat = false;
		performRandomOperation(diceString, 1, clientIdText,ops);
	}

    stopButton.onclick = () => 
    {
		repeat = false;
    }

    resetButton.onclick = () =>
    {
        var len = diceString.getText().length;
        if(len>0)
        {
            diceString.removeText(0, len);
            diceString.insertText(0, "Hello World!");
        }        
    }

    clearButton.onclick = () =>
    {
        ops.innerHTML = '';
    }

    // Get the current value of the shared data to update the view whenever it changes.
    const updateDice =  (event, target) => {
        const diceValue = diceString.getText();
        if (event!=null)
        {
            if(!event.isLocal)
            {
                ops.appendChild(document.createTextNode(Date.now() + ",mockNetwork.Receive("+clientIdText.value+",\""+event.opArgs.sequencedMessage.clientId+"\");"));
                ops.appendChild(document.createElement("br"));
            }
            else
            {                
                switch(event.opArgs.op.type)
                {
                    case 0:
                        ops.appendChild(document.createTextNode(Date.now() 
                        + ",mockNetwork.Insert("+clientIdText.value+",new GlobalCp("+event.opArgs.op.pos1+"),\""+event.opArgs.op.seg+"\",null);mockNetwork.Send("+clientIdText.value+");mockNetwork.Receive("+clientIdText.value+","+clientIdText.value+");"));
                        ops.appendChild(document.createElement("br"));
                        break;
                    case 1:
                        ops.appendChild(document.createTextNode(Date.now() 
                        + ",mockNetwork.Delete("+clientIdText.value+",new GlobalCp("+event.opArgs.op.pos1+"),new GlobalCp("+event.opArgs.op.pos2+"));mockNetwork.Send("+clientIdText.value+");mockNetwork.Receive("+clientIdText.value+","+clientIdText.value+");"));
                        ops.appendChild(document.createElement("br"));
                        break
                }
            }
        }        
        dice.textContent = diceValue;        

        ops.appendChild(document.createTextNode((Date.now()+1) + ",Assert.AreEqual(\""+diceValue+"\", mockNetwork.ReadClientContent("+clientIdText.value+"));"));
        ops.appendChild(document.createElement("br"));      
    };
    updateDice();

    // Use the changed event to trigger the rerender whenever the value changes.
    diceString.on("sequenceDelta", updateDice);
}