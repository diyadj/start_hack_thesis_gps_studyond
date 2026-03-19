import { agentExecutor } from './agent'
import { SYSTEM_PROMPT_BASE } from './prompts'

export async function askStudyond(question: string): Promise<string> {
  const result = await agentExecutor.invoke({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_BASE },
      { role: 'user', content: question },
    ],
  })
  const last = result.messages[result.messages.length - 1]
  return typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content)
}