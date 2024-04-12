export default {
    extends: ['@commitlint/config-conventional'],
    plugins: [
        {
        rules: {
            'subject-prefix-with-jira-ticket-id': parsed => {
            const { subject } = parsed
            const match = subject ? subject.match(/^\[[A-Z]{3,5}-\d+\]\s/) : null
            if (match) return [true, '']
            return [
                false,
                `The commit message's subject must be prefixed with an uppercase JIRA ticket ID.
    A correct commit message should be like: feat: [JIRA-1234] fulfill this feature
    Your subject: ${subject}
    Please revise your commit message.
`
            ]
            }
        }
        }
    ],
    rules: {
        'subject-prefix-with-jira-ticket-id': [2, 'always']
    }
}