import fs from 'fs';
let content = fs.readFileSync('src/services/ExcelExportService.ts', 'utf-8');

const targetMethod = `      const splitIntoParagraphs = (text: string) => {
        if (!text) return [];
        let t = text.replace(/\\r/g, '');
        let blocks: string[] = [];
        
        if (t.includes('\\n\\n')) {
            blocks = t.split(/\\n\\n+/).map(s => s.trim()).filter(Boolean);
        } else {
            t = t.replace(/\\n(?=\\s*(제\\d+조|제\\d+항|①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|⑪|⑫|⑬|⑭|⑮|부칙|\\[별표)\\s*)/g, '\\n\\n');
            blocks = t.split(/\\n\\n+/).map(s => s.trim()).filter(Boolean);
        }

        const mergedBlocks: string[] = [];
        for (const block of blocks) {
            const isNewSection = /^\\s*(제\\d+조|제\\d+항|①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|⑪|⑫|⑬|⑭|⑮|부칙|\\[별표)/.test(block);
            
            if (isNewSection || mergedBlocks.length === 0) {
                mergedBlocks.push(block);
            } else {
                mergedBlocks[mergedBlocks.length - 1] += '\\n' + block;
            }
        }
        
        return mergedBlocks;
      };`;

const replMethod = `      const splitIntoParagraphs = (text: string) => {
          if (!text) return [];
          let t = text.replace(/\\r/g, '');
          let blocks: string[] = [];
          
          const lines = t.split('\\n');
          let currentBlock = "";
          
          for (const line of lines) {
              // 제O조, 제O조의O, 부칙, [별표] 등으로 시작하는지 확인
              const isNewSection = /^\\s*(제\\d+조(?:의\\d+)?|부칙|\\[별표)/.test(line);
              if (isNewSection) {
                  if (currentBlock) blocks.push(currentBlock.trim());
                  currentBlock = line;
              } else {
                  if (currentBlock) {
                      currentBlock += '\\n' + line;
                  } else {
                      currentBlock = line;
                  }
              }
          }
          if (currentBlock) blocks.push(currentBlock.trim());
          
          return blocks;
      };`;

content = content.replace(targetMethod, replMethod);
fs.writeFileSync('src/services/ExcelExportService.ts', content);
