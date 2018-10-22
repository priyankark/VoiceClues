'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const config = {
    logging: true,
    intentMap: {
    'AMAZON.RepeatIntent':'RepeatIntent',
    'AMAZON.FallbackIntent':'Unhandled',
    'AMAZON.HelpIntent':'HelpIntent',
    'AMAZON.StopIntent':'END',
    'AMAZON.CancelIntent':'END'

    },
    db: {
        type: 'dynamodb',
        tableName: 'VoiceClues',
    }
};

const app = new App(config);
let d = require("./app_data/data");



// =================================================================================
// App Logic
// =================================================================================

//Helper functions

function combineArray(array){
    let message=``;
    array.map((i,index)=>{
        message+=`option ${index+1}, ${i}. `;
    });
    return message;
}


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  function returnRandom(array)
  {
      return array[Math.floor(Math.random()*array.length)];
  }




app.setHandler({
    'LAUNCH': function() {
        let greetings=returnRandom(shuffle(["Welcome to voice clues!","It's time for some fun!","Time to put on your thinking caps!"]));
        let instructions="I will give you a series of clues and you need to guess what or who I am thinking of.";
        let speechOutput=`${greetings} ${instructions} Say start to begin the game, say help to know the rules or say score card to know your life time points.`;
        let speech=this.speechBuilder().addAudio('soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_intro_01',this.getType()==="AlexaSkill").addText(speechOutput);
        if(this.getType()==="AlexaSkill")
        {
            this.alexaSkill().ask(speech,speechOutput);
        }
        else
        {
            this.googleAction().ask(speechOutput,speechOutput);
        }
        
    },
    'StartQuizIntent': async function(message) {
        let attributes = this.getSessionAttributes();
        d=shuffle(d);
        let neutral='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_outro_01';
        if(Object.keys(attributes).length!==0&&attributes["started"]===true)
        {
            attributes["started"]=false;
            this.setSessionAttributes(attributes);
            this.toIntent('RepeatIntent');

        }
        if(Object.keys(attributes).length===0)
        {
            attributes["index"]=0;
            attributes["flag"]=-1;
            attributes["hintIndex"]=0;
            attributes["score"]=0;
            attributes["data"]=d.slice(0,5);
            attributes["started"]=true;
            let {data}=attributes;
            this.setSessionAttributes(attributes);
            let greetings=returnRandom(shuffle(["Okay! Let's get started!","Let's get going!","Let us begin the game!"]));
            let category=data[0].category;
            let hint=data[0].hints[0];
            let options=combineArray(data[0].options);
            let speechOutput=`${greetings} I am thinking of a ${category}. Your first hint is, ${hint}, and your options are ${options}.`;
            if(this.getType()==="AlexaSkill")
            {
                let speech=this.speechBuilder().addAudio(neutral).addText(speechOutput);
                this.ask(speech,speechOutput);
            }
            else
            {
                let speech=this.speechBuilder().addText(speechOutput);
                this.ask(speech,speechOutput);

            }
            
        }
        else
        {
            let {data}=attributes;
            attributes["started"]=true;
            this.setSessionAttributes(attributes);
            if(attributes["flag"]==-1)
            {
                if(attributes["hintIndex"]==0)
                {
                    attributes["hintIndex"]=1;
                    this.setSessionAttributes(attributes);
                    let index=attributes["index"];
                    let hint=data[index].hints[1];
                    let options=combineArray(data[index].options);   
                    let speechOutput=`${message} Here's your next hint. ${hint}, and your options are ${options}`;
                    this.ask(speechOutput,speechOutput);
                }
                else
                if(attributes["hintIndex"]==1)
                {
                    attributes["hintIndex"]=2;
                    this.setSessionAttributes(attributes);
                    let index=attributes["index"];
                    let hint=data[index].hints[2];
                    let options=combineArray(data[index].options);   
                    let speechOutput=`${message} Here's your next hint. ${hint}, and your options are ${options}`;
                    
                    this.ask(speechOutput,speechOutput);
                }
                else
                {
                    let index=attributes["index"];
                    if(index==4)
                    {
                        let speechOutput=`${message}, Your score is ${attributes["score"]}. You can say score card to know your present life time points or say stop to quit talking to me. `;
                        if(Object.keys(this.user().data).length===0)
                          {
                            this.user().data.score=attributes["score"];
                          }  
                        else
                         {
                            this.user().data.score+=attributes["score"];
                         }
                           
                        this.ask(speechOutput,speechOutput);
                    }
                    else
                    {
                        attributes["index"]+=1;
                        attributes["hintIndex"]=0;
                        attributes["flag"]=-1;
                        this.setSessionAttributes(attributes);
                        let greetings=returnRandom(shuffle(["Okay, let me now think of something else. On to the next question.","Let me think up something else now.","Time for you to get your Sherlock mode on for the next question."]));
                        let hint=data[attributes["index"]].hints[0];
                        let category=data[attributes["index"]].category;
                        let options=combineArray(data[attributes["index"]].options);   
                        let speechOutput=`${greetings} I am now thinking of a ${category}. Your first hint is, ${hint}, and your options are ${options}`;
                        if(this.getType()==="AlexaSkill")
                        {
                            let speech=this.speechBuilder().addText(message).addAudio(neutral).addText(speechOutput);
                            this.ask(speech,speech); 
                        }
                        else
                        {
                            let speech=this.speechBuilder().addText(message).addText(speechOutput);
                            this.ask(speech,speech);
                        }
    
                        

                    }
                }
            }
            else
            {
                let index=attributes["index"];
                if(index==4)
                {
                    let compli="";
                    if(attributes["score"]>35)
                     compli=returnRandom(shuffle(["Nice job Sherlock!","You have made me proud.","Terrific deduction skills!","Smart work!"]));
                    else
                    compli=returnRandom(shuffle(["Everyone has their bad days! I am sure you will do better the next time.","You need to train harder young Padawan.","You need to work more on your general knowledge."]));
                    let speechOutput=`${message} Your score is ${attributes["score"]} this session. ${compli} You can now say score card to know your lifetime points or say stop to quit talking to me.`;
                    if(Object.keys(this.user().data).length===0)
                    {
                        this.user().data.score=attributes["score"];
                    }  
                    else
                    {
                        this.user().data.score+=attributes["score"];
                    }
                           
                        this.ask(speechOutput,speechOutput);
                }
                else
                {
                    attributes["index"]+=1;
                    attributes["hintIndex"]=0;
                    attributes["flag"]=-1;
                    this.setSessionAttributes(attributes);
                    let greetings=returnRandom(shuffle(["Okay, let me now think of something else. On to the next question.","Let me think up something else now.","Time for you to get your Sherlock mode on for the next question."]));
                    let hint=data[attributes["index"]].hints[0];
                    let options=combineArray(data[attributes["index"]].options);  
                    let category=data[attributes["index"]].category; 
                    let speechOutput=`${greetings} I am now thinking of a ${category}. Your first hint is, ${hint}, and your options are ${options}`;
                    if(this.getType()==="AlexaSkill")
                    {
                        let speech=this.speechBuilder().addText(message).addAudio(neutral).addText(speechOutput);
                        this.ask(speech,speech);
                    }
                    else
                    {
                        let speech=this.speechBuilder().addText(message).addText(speechOutput);
                        this.ask(speech,speech);
                    }
                    

                }

            }
        }
     },

    'AnswerIsIntent': function(option) {
        let opt=parseInt(option.value);
        let attributes=this.getSessionAttributes();
        let {index,hintIndex,data}=attributes;
        if(isNaN(opt)||opt<1||opt>4)
        {
            this.toIntent('Unhandled');
        }
        else
        {
            attributes["started"]=false;
            this.setSessionAttributes(attributes);
            if(opt-1==data[index].answer)
            {
                attributes["flag"]=0;
                if(hintIndex==0)
                    attributes["score"]+=10;
                else
                    if(hintIndex==1)
                     attributes["score"]+=5;
                else
                    attributes["score"]+=2;
                this.setSessionAttributes(attributes);
                
                let compliment=returnRandom(shuffle(['Woot Woot!','Awesome job!','Great going!','yo, are you a psychic? That was right!','Elementary, my dear Watson!','You are Sherlocks next sidekick.']));
                let message=returnRandom(shuffle(['Right answer!','You got that right!']));
                let positive=returnRandom(shuffle(['soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_01','soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_02','soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_03']));
                if(this.getType()==="AlexaSkill")
                {
                 let speech=this.speechBuilder().addAudio(positive).addText(`${compliment} ${message}`);
                 this.toIntent('StartQuizIntent',speech).tell('thats right');
                }
                else
                {
                    let speech=this.speechBuilder().addText(`${compliment} ${message}`);
                    this.toIntent('StartQuizIntent',speech).tell('thats right');
                }
                
            }
            else
            {
            let compliment=returnRandom(shuffle(['Yikes!','Boo hoo!','Think harder!','You will have to try harder!']));
            let message=returnRandom(shuffle(['That was wrong!','Wrong Answer!','You need a new thinking cap because that was wrong!']));
            let rightAnswer='';
            let {index}=attributes;

            if(attributes["hintIndex"]==2)
             rightAnswer=`The right guess would have been option, ${data[index].answer+1}, ${data[index].options[data[index].answer]}`;
            let finalMessage=`${compliment} ${message} ${rightAnswer}`;
            let negative=returnRandom(shuffle(['soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_01','soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_02','soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_03']));
            if(this.getType()==="AlexaSkill")
            {
            let speech=this.speechBuilder().addAudio(negative).addText(finalMessage);
            this.toIntent('StartQuizIntent',speech).tell('thats wrong.');
            }
            else
            {
                this.toIntent('StartQuizIntent',finalMessage).tell('thats wrong.');
            }
            
            }
        }
    
    },
    'ScoreCardIntent': function() {
        if(Object.keys(this.user().data).length===0)
         this.tell('You have not started playing yet!');
        let speechOutput=`Your life time points are ${this.user().data.score}`;
        this.tell(speechOutput);
    },
    'RepeatIntent': function() {
        let attributes=this.getSessionAttributes();
        if(Object.keys(attributes).length===0)
        {
            let speechOutput=`You have not started the game yet. There is nothing to repeat. Say start to begin the game or help to ask for help.`;
            this.ask(speechOutput,speechOutput);
        }
        else
        {
            let index=attributes["index"];
            let data=attributes["data"];
            let hintIndex=attributes["hintIndex"];
            let question=data[index].hints[hintIndex];
            let options=combineArray(data[index].options);
            let guessIt=returnRandom(shuffle(['Okay! Can you think what I am thinking of?','Take a guess.','Lets see if you can crack this.']));
            let message=`Okay. Let me repeat your present hint. Your present hint is ${question}, and your options are ${options}. ${guessIt}`;
            this.ask(message,message);
        }
    },
    'Unhandled': function() {
        let attributes=this.getSessionAttributes();
        console.log('entering unhandled');
        if(Object.keys(attributes).length===0)
        {
            let speechOutput=`Sorry. I didn't understand what you just said. You haven't started playing yet. Say start and let us begin!`;
            this.ask(speechOutput,speechOutput);
        }
        else
        {
            
            let attributes=this.getSessionAttributes();
            let {data}=attributes;
            let index=attributes["index"];
            let hintIndex=attributes["hintIndex"];
            let question=data[index].hints[hintIndex];
            let guessIt=returnRandom(shuffle(['Okay! Can you think what I am thinking of?','Take a guess.','Lets see if you can crack this.']));
            let message=`Your present hint is ${question} ${guessIt}`;
            
            let options=combineArray(data[index].options);
            let speechOutput=`Sorry. I didn't understand what you just said. Let me repeat the question again. Your present hint is, ${question}, and your options are, ${options}. ${guessIt} Make sure you answer with option followed by the number corresponding to the answer. For example, option one.`;
            this.ask(speechOutput,speechOutput);
            
        }
    },
    'HelpIntent': function() {
        let speechOutput=` With voice clues, you need to read minds. Your assistant will think up something and give you clues.
        You need to use those clues to get to what your assistant is thinking of. The lower number of clues you use to get to the answer, the greater your points. Guessing 
        the answer in the first clue gets you 10, second clue gets you 5 and third clue gets you 2. To answer, make use of the options. For example, if you think the answer is the first option, say option one.
        For each question, you only have three tries with three clues. And there are five questions in each session. You can say repeat to repeat the present hint. You can now say start, to begin a new game or say score card to know your life time points.`;
        this.setSessionAttributes({});
        this.ask(speechOutput,speechOutput);
    },
    'END': function() {
        let greeting=['See you again!','Good bye, until next time!','Good bye! If you find some time, do leave Voice Clues a review'];
        let speechOutput=returnRandom(greeting);
        this.tell(speechOutput);
    }
});

app.setDynamoDb('VoiceClues');
module.exports.app = app;
