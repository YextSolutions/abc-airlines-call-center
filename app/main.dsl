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

// declare external functions here
external function findFaq(verticalKey: string, query: string): Faq;
external function findFlights(from: string, to: string, date: string): Flight[];

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
    transitions
    {
        handle_q: goto handle_faq on #getSentenceType() == "question";
    }
}

node handle_faq
{
    do
    {
        var userQuestion = #getMessageText();
        var faq: Faq = external findFaq("faqs", userQuestion);
        
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
            goto other_qs;
        }
        
        wait *;
    }
    transitions
    {
        book_flight: goto book_flight on $followUpVertical == "flights" and #messageHasIntent("yes");
        other_qs: goto other_qs;
    }
}

node other_qs
{
    do
    {
        #sayText("Is there anything else I can help you with today?");
        wait *;
    }
    transitions
    {
        handle_q: goto handle_faq on #getSentenceType() == "question";
        no_more_qs: goto bye on #messageHasIntent("no");
    }
}

node book_flight
{
    do
    {
        #sayText("It looks like you are schdeduled to fly from New York to Chicago on March 13 at 7 pm. What is the new date you would like to fly?");
        wait *;
    }
    transitions
    {
        select_flight_date: goto select_flight_date on #messageHasData("date");
    }
}

node select_flight_date
{
    do
    {
        var new_date = #messageGetData("date")[0]?.value??"";
        
        // passing static values but from and to cities could be extracted from the user's dictation
        var flights: Flight[] = external findFlights("new york", "chicago", new_date);
        
        if(flights.length() != 0)
        {
            var num_flights = flights.length().toString();
            #sayText("It looks like we have " +  num_flights + " flights on " + new_date);
            
            var option_a = flights.shift();
            if(option_a is not null)
            {
                #sayText("Option A is at " + option_a.departureTime + " and costs " + option_a.price + " dollars");
            }
            
            var option_b = flights.shift();
            if(option_b is not null)
            {
                #sayText("Option B is at " + option_b.departureTime + " and costs " + option_b.price + " dollars");
            }
            
            var option_c = flights.shift();
            if(option_c is not null)
            {
                #sayText("Option C is at " + option_c.departureTime + " and costs " + option_c.price );
            }
            
            var index: number = blockcall select_flight_option();
            
            #sayText("Ok great I will get that booked for you.");
        }
        else
        {
            #sayText("Sorry! It looks like we don't have any flights on that day.");
        }
        
        goto other_qs;
    }
    transitions
    {
        other_qs: goto other_qs;
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

node bye
{
    do
    {
        #sayText("It was my pleasure to help. Have a nice day! Bye!");
        exit;
    }
}
