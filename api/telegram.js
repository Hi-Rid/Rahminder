const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
const TG = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function reply(chatId, text) {
    await fetch(`${TG}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
    });
}

module.exports = async (req, res) => {
    const msg = req.body?.message;
    if (!msg?.text) return res.status(200).send('ok');

    const chatId = msg.chat.id;
    const allowed = process.env.ALLOWED_CHAT_ID;

    // Belum dikunci: tampilkan chat id
    if (!allowed) {
        await reply(chatId, `Chat ID kamu: ${chatId}`);
        return res.status(200).send('ok');
    }
    // Abaikan orang lain
    if (String(chatId) !== allowed) return res.status(200).send('ok');

    if (msg.text === '/list') {
        const { data } = await supabase
            .from('notes')
            .select('id, content')
            .eq('chat_id', chatId)
            .eq('done', false)
            .order('created_at', { ascending: false })
            .limit(20);

        const text = data?.length
            ? data.map((n) => `#${n.id} ${n.content}`).join('\n')
            : 'Belum ada note.';
        await reply(chatId, text);
        return res.status(200).send('ok');
    }

    await supabase.from('notes').insert({ chat_id: chatId, content: msg.text });
    await reply(chatId, 'Tersimpan ✅');
    return res.status(200).send('ok');
};