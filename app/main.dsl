import "commonReactions/all.dsl";

context
{
    // declare input variables here. phone must always be declared
    input phone: string;
    
    // declare storage variables here
    firstName: string = "";
    lastName: string = "";
    followUpVertical: string = "";
}

type Faq =
{
    answer: string;
    question: string?;
    followUpQuestion: string?;
    followUpVertical: string?;
}
;

type Flight =
{
    departureDate: string;
    departureTime: string;
    from: string;
    to: string;
    price: string;
}
;

type AnswersResponse =
{
    entityType: string;
    faq: Faq;
    flight: Flight;
}
;

// declare external functions here
external function verticalSearch(verticalKey: string, query: string): AnswersResponse;

// lines 28-42 start node
start node root
{
    do //actions executed in this node
    {
        #connectSafe($phone); // connecting to the phone number which is specified in index.js that it can also be in-terminal text chat
        #waitForSpeech(1000); // give the person a second to start speaking
        #say("greeting"); // and greet them. Refer to phrasemap.json > "greeting" (line 12); note the variable $name for phrasemap use
        wait *;
    }
    transitions // specifies to which nodes the conversation goes from here
    {
    }
}

digression greeting
{
    conditions
    {
        on #messageHasData("firstName");
    }
    
    do
    {
        set $firstName =  #messageGetData("firstName")[0]?.value??"";
        set $lastName =  #messageGetData("lastName")[0]?.value??"";
        #sayText("Nice to meet you " + $firstName + ", how may I assist you today?");
        wait *;
    }
}

digression handle_faq
{
    conditions
    {
        on #getSentenceType() == "question";
    }
    do
    {
        var userQuestion = #getMessageText();
        var answersResponse: AnswersResponse = external verticalSearch("faqs", userQuestion);
        var faq = answersResponse.faq;
        
        #sayText(faq.answer);
        
        if(faq.followUpQuestion is not null)
        {
            #sayText(faq.followUpQuestion);
            if (faq.followUpVertical is not null)
            {
                set $followUpVertical = faq.followUpVertical;
            }
        }
        else
        {
            #sayText("Is there anything else I can help you with today?");
        }
        
        wait *;
    }
    transitions
    {
        book_flight: goto book_flight on $followUpVertical == "flights";
    }
}

node book_flight
{
    do
    {
        var flights = external verticalSearch("flights", "flights");
        #sayText("It looks like we have flights on Tuesday, March 15. Option A is 7 pm for $299 and Option B is 10 pm for $249.");
        var index: number = blockcall select_flight_option();
        
        wait *;
    }
}

block select_flight_option(): number
{
    start node root
    {
        do
        {
            #sayText("Please state which option you would like to book.");
            wait *;
        }
    }
    
    digression capture_selection
    {
        conditions
        {
            on #messageHasData("options");
        }
        do
        {
            var option = #messageGetData("options")[0]?.value;
            
            if (option == "option a")
            {
                return 0;
            }
            else if (option == "option b")
            {
                return 1;
            }
            else if (option == "option b")
            {
                return 2;
            }
            else if (option == "option b")
            {
                return 3;
            }
            else
            {
                return 4;
            }
        }
    }
}

node yes
{
    do
    {
        // var result = external function1("test");    //call your external function
        #say("yes"); //call on phrase "question_1" from the phrasemap
        exit;
    }
}

node no
{
    do
    {
        #say("no");
        exit;
    }
}

digression how_are_you
{
    conditions
    {
        on #messageHasIntent("how_are_you");
    }
    do
    {
        #sayText("I'm well, thank you!", repeatMode: "ignore");
        #repeat(); // let the app know to repeat the phrase in the node from which the digression was called, when go back to the node
        return; // go back to the node from which we got distracted into the digression
    }
}
