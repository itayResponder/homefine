export function generateAutomateFlow(apiKey: string, webhookUrl: string): string {
    return JSON.stringify({
        version: 1,
        description: 'HomeFine Wallet Automation',
        flows: [
            {
                name: 'HomeFine Wallet',
                comment: 'Automatically logs Google Wallet purchases to HomeFine',
                steps: [
                    {
                        block: 'com.llamalab.automate.block.NotificationPosted',
                        args: {
                            package: 'com.google.android.apps.walletnfcrel',
                            proceed: 'TRANSITION',
                            title_variable: 'notifTitle',
                            message_variable: 'notifText',
                        },
                    },
                    {
                        block: 'com.llamalab.automate.block.HttpRequest',
                        args: {
                            url: webhookUrl,
                            method: 'POST',
                            content_type: 'application/json',
                            body: `{"title":"{notifTitle}","body":"{notifText}","apiKey":"${apiKey}"}`,
                        },
                    },
                ],
            },
        ],
    })
}
