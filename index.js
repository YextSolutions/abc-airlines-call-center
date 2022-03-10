const dasha = require("@dasha.ai/sdk");
const fs = require("fs");
const { provideCore, Matcher } = require("@yext/answers-core");

const answers = provideCore({
  apiKey: 'b586bfc576229e81f8b575896846a9d1',
  experienceKey: "abc-airlines",
  locale: "en",
  experienceVersion: "PRODUCTION",
  endpoints: {
    universalSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/query?someparam=blah",
    verticalSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/query",
    questionSubmission:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/createQuestion",
    status: "https://answersstatus.pagescdn.com",
    universalAutocomplete:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/autocomplete",
    verticalAutocomplete:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/autocomplete",
    filterSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/filtersearch",
  },
});

async function main() 
{
  const app = await dasha.deploy("./app");

  app.connectionProvider = async (conv) =>
    conv.input.phone === "chat"
      ? dasha.chat.connect(await dasha.chat.createConsoleChat())
      : dasha.sip.connect(new dasha.sip.Endpoint("default"));

  app.ttsDispatcher = () => "dasha";

  app.setExternal("verticalSearch", async (args)=> {
    const query = args.query;
    const verticalKey = args.verticalKey;

    const searchRequest = {
      query,
      verticalKey,
      limit: verticalKey === "faqs" ? 1 : 5
    }

    if(verticalKey === "flights"){
      searchRequest.staticFilters = { fieldId: "c_departureDate", matcher: Matcher.GreaterThan, value: '2022-04-04T05:56'}
    }
    
    const searchResults = await answers.verticalSearch(searchRequest);
    console.log("search results length: " + searchResults.verticalResults.results.length);

    if(verticalKey === "faqs"){
      if(searchResults.verticalResults.results[0]){
        const faq = searchResults.verticalResults.results[0].rawData;
        return {
          faq: {
            question: faq.name,
            answer: faq.answer,
            followUpQuestion: faq.c_followUpQuestion,
            followUpVertical: faq.c_followUpVertical
          }
        }
      } else {
        return {
          faq: {
            answer: "Sorry! I could not find the answer to you question."
          }
        }
      }
    } else {
      const flights = searchResults.verticalResults.results.map(result => {
        const flight = result.rawData;
        return {
          flight: {
            departureDate: flight.c_departureDate,
            departureTime: flight.c_departureTime,
            from: flight.c_from,
            to: flight.c_to,
            price: flight.c_price 
          }
        }
      })
      return flights;
    }
  });

  await app.start();

  const conv = app.createConversation({ phone: process.argv[2] ?? "", name: process.argv[3] ?? "" });

  if (conv.input.phone !== "chat") conv.on("transcription", console.log);

  const logFile = await fs.promises.open("./log.txt", "w");
  await logFile.appendFile("#".repeat(100) + "\n");

  conv.on("transcription", async (entry) => {
    await logFile.appendFile(`${entry.speaker}: ${entry.text}\n`);
  });

  conv.on("debugLog", async (event) => {
    if (event?.msg?.msgId === "RecognizedSpeechMessage") {
      const logEntry = event?.msg?.results[0]?.facts;
      await logFile.appendFile(JSON.stringify(logEntry, undefined, 2) + "\n");
    }
  });

  const result = await conv.execute();

  console.log(result.output);

  await app.stop();
  app.dispose();

  await logFile.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
