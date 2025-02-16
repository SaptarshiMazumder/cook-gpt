// Model configuration
const models = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        client: null,
        modelName: "gpt-4o",
    },
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY, // You'll need to set this environment variable
        client: null,
        modelName: "deepseek-chat", // Replace with the correct DeepSeek model name
    },
};

module.exports = { models };
