import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

// 强制声明该 API 运行在 Node.js 环境，并关闭静态缓存
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 【关键修正】在 Next.js 后端 API 中，利用绝对路径定位，确保打包后线上也能找到
        const pdfPath = path.resolve(process.cwd(), 'public', 'result.pdf');

        // 防御性编程：先检查文件，防止 fs.readFileSync 抛出致命异常
        if (!fs.existsSync(pdfPath)) {
            return NextResponse.json({ 
                success: false, 
                error: `PDF文件未找到。当前尝试路径为: ${pdfPath}` 
            }, { status: 404 });
        }

        const buffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(buffer);
        const text = data.text;

        // 【正则修正】去掉全局修饰符 g，改为单次匹配，并加上安全校验
        const fetalSexPattern = /Fetal\s+sex[\s:]*(Male|Female)/i;
        const match = text.match(fetalSexPattern);

        // 只有匹配成功且捕获组有值时才返回
        if (match && match[1]) {
            const fetalSex = match[1].trim();
            return NextResponse.json({ success: true, fetalSex });
        }

        return NextResponse.json({ 
            success: false, 
            error: "在PDF文本中未捕获到 Fetal sex 关键信息。" 
        }, { status: 404 });

    } catch (error) {
        // 服务器内部错误兜底
        console.error("API 崩溃详情:", error); // 这会在你的终端（Terminal）里打印出具体错在哪一行
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            stack: error.stack // 把错误堆栈也返回给前端，方便一眼看出是 fs 报错还是 pdf-parse 报错
        }, { status: 500 });
    }
}