import express from "express";
import { OpenAI } from "langchain/llms/openai";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { MessagesPlaceholder, PromptTemplate } from "langchain/prompts";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { Calculator } from "langchain/tools/calculator";
import { DynamicTool } from "langchain/tools";
import dotenv from "dotenv";
import cors from "cors";
import { ChatOpenAI } from "langchain/chat_models/openai";
dotenv.config();

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.6,
});
const memory = new BufferMemory({
  memoryKey: "chat_history",
  returnMessages: true,
});

const chatPrompt =
  PromptTemplate.fromTemplate(`The following is a friendly conversation between a human and an AI. The AI is trying to use humor to brighten the humans day. If the users response is sad or depressive or angry, its the job of the AI to make them feel better. Every answer should start with "Hello There!"

  Current conversation:
  {chat_history}
  Human: {input}
  AI:`);
const tools = [
  new Calculator(),
  new DynamicTool({
    name: "FOO",
    description:
      "Call this when the output includes a number that is divisible by 3, the AI should respond with 'Foo'",
    func: async (a) => {
      console.log("a....", a);
      return "Foo";
    },
  }),
  // new DynamicTool({
  //   name: "BAR",
  //   description:
  //     "Call this to get the value of bar when the answer is divisible by 5. When the LLM output includes a number that is divisible by 5, the AI should respond with 'Bar'",
  //   func: async () => "Bar",
  // }),
  // new DynamicTool({
  //   name: "FOOBAR",
  //   description:
  //     "Call this to get the value of foobar when the answer is divisible by 5 and is divisible by 3. When the output includes a number that is divisible by 5 and the output is also divisible by 3, the AI should respond with 'Bar'",
  //   func: async () => "Bar",
  // }),
];

const executor = await initializeAgentExecutorWithOptions(tools, model, {
  agentType: "zero-shot-react-description",
  verbose: true,
  memory,
  // prompt: chatPrompt,
  agentArgs: {
    inputVariables: ["input", "agent_scratchpad", "chat_history"],
    // memoryPrompts: [new MessagesPlaceholder("chat_history")],
  },
});
// const chain = new ConversationChain({
//   prompt: chatPrompt,
//   llm: model,
//   memory: memory,
// });

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

app.post("/ask", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    if (prompt == null) {
      throw new Error("Uh oh, no prompt was provided");
    }

    const response = await executor.call({ input: prompt });

    const completion = response.output;

    return res.status(200).json({
      success: true,
      message: completion,
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}!!`));
