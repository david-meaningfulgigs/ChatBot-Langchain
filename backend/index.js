import express from "express";
import { OpenAI } from "langchain/llms/openai";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { HumanMessage, AIMessage } from "langchain/schema";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.6,
});
const memory = new BufferMemory();
// This chain is preconfigured with a default prompt
const chain = new ConversationChain({ llm: model, memory: memory });

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

    const response = await chain.call({ input: prompt });

    const completion = response.response;

    return res.status(200).json({
      success: true,
      message: completion,
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}!!`));
