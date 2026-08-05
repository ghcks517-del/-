const beforeText = `제175조(과태료) ① ~ ④ (생 략)
⑤ 다음 각 호의 어느 하나에 해당하는 자에게는 500만원 이하의 과태료를 부과한다.
1. 제15조제1항 ...
2. ~ 16. (생 략)
⑥·⑦ (생 략)
제176조(벌칙) 어쩌구
부칙 어쩌구`;

const splitIntoParagraphs = (text: string) => {
    if (!text) return [];
    let t = text.replace(/\r/g, '');
    let blocks: string[] = [];
    
    // Split by lines
    const lines = t.split('\n');
    let currentBlock = "";
    
    for (const line of lines) {
        const isNewSection = /^\s*(제\d+조(?:의\d+)?|부칙|\[별표)/.test(line);
        if (isNewSection) {
            if (currentBlock) blocks.push(currentBlock.trim());
            currentBlock = line;
        } else {
            if (currentBlock) {
                currentBlock += '\n' + line;
            } else {
                currentBlock = line;
            }
        }
    }
    if (currentBlock) blocks.push(currentBlock.trim());
    
    return blocks;
};

console.log(splitIntoParagraphs(beforeText));
