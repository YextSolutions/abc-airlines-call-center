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

  app.setExternal("findFaq", async (args)=> {
    const query = args.query;
    
    const searchResults = await answers.verticalSearch({ query, verticalKey: "faqs", limit: 1});

    if(searchResults.verticalResults.results[0]){
      const faq = searchResults.verticalResults.results[0].rawData;
    return {
        question: faq.name,
        answer: faq.answer,
        followUpQuestion: faq.c_followUpQuestion,
        followUpVertical: faq.c_followUpVertical
      }
    } else {
      return {
        faq: {
          answer: "Sorry! I could not find the answer to you question."
        }
      }
    }
  });

  app.setExternal("findFlights", async (args) => {
    // from and to cities could be used as filter values
    const from = args.from;
    const to = args.to;
    let date = args.date;

    try {
      date = formatDate(date);
    } catch {
      return [];
    }

    const searchRequest = { 
      query: 'flights', 
      verticalKey: "flights", 
      limit: 3,
      staticFilters: { fieldId: 'c_departureDate', matcher: Matcher.Equals, value: date },
    }

    const searchResults = await answers.verticalSearch(searchRequest);

    const flights =  searchResults.verticalResults.results.map(result => {
      const flight = result.rawData;
      return {
        departureDate: flight.c_departureDate,
        departureTime: flight.c_departureTime,
        from: flight.c_from,
        to: flight.c_to,
        price: flight.c_price 
      }
    })

    return flights;
  })

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

function formatDate(spokenDate){
  const words = spokenDate.split(' ');
  if(words.length === 2){
    const month = words[0];
    const date = words[1];

    switch (month) {
      case 'january':
        return `2022-01-${date.length === 1 ? '0' + date : date}`;
      case 'february':
        return `2022-02-${date.length === 1 ? '0' + date : date}`;
      case 'march':
        return `2022-03-${date.length === 1 ? '0' + date : date}`;
      case 'april':
        return `2022-04-${date.length === 1 ? '0' + date : date}`
      case 'may':
        return `2022-05-${date.length === 1 ? '0' + date : date}`
      case 'june':
        return `2022-06-${date.length === 1 ? '0' + date : date}`
      case 'july':
        return `2022-07-${date.length === 1 ? '0' + date : date}`
      case 'august':
        return `2022-08-${date.length === 1 ? '0' + date : date}`
      case 'september':
        return `2022-09-${date.length === 1 ? '0' + date : date}`
      case 'october':
        return `2022-10-${date.length === 1 ? '0' + date : date}`
      case 'november':
        return `2022-11-${date.length === 1 ? '0' + date : date}`
      case 'december':
        return `2022-12-${date.length === 1 ? '0' + date : date}`
      default:
        throw 'Invalid date';
    }
  } else {
    throw 'Invalid date';
  }
} 