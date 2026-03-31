import express from 'express';
import Logger from '../logger.js';
import { getMember, getMemberships, insertMember, login } from '../db.js';
import jwt from 'jsonwebtoken';
const memberRouter = express.Router();
memberRouter.post("/login", async (req, res) => {
    let apiLogEntry = null;
    try {
        const { mem_id_act, mem_password } = req.body; // 👈 자동 파싱    
        if (!mem_id_act) {
            return res.status(401).json({
                success: false,
                error: '회원 ID가 필요합니다.'
            });
        }
        if (!mem_password) {
            return res.status(401).json({
                success: false,
                error: '회원 비밀번호가 필요합니다.'
            });
        }
        apiLogEntry = await Logger.logApiStart('POST /api/member/login', [mem_id_act]);
        const result = await login(mem_id_act, mem_password);
        if (result.STATUS === "FAIL") {
            await Logger.logApiError(apiLogEntry, result.ERROR);
            return res.status(401).json({
                success: false,
                error: result.ERROR
            });
        }
        else {
            req.session.user = result.USER;
            req.session.isLogined = true;
            const member = result.USER;
            const token = jwt.sign({
                mem_id: member.MEM_ID,
                mem_id_act: member.MEM_ID_ACT,
                mem_name: member.MEM_NAME,
                mem_nickname: member.MEM_NICKNAME,
                mem_img: member.MEM_IMG,
                mem_sex: member.MEM_SEX,
                mem_age: member.MEM_AGE,
                mem_point: member.MEM_POINT,
                mem_exp_point: member.MEM_EXP_POINT,
                mem_lvl: member.MEM_LVL
            }, process.env.JWT_SECRET, { expiresIn: '7d' } // 7일 유효
            );
            res.cookie('sessionID', token, { httpOnly: true });
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });
            await Logger.logApiSuccess(apiLogEntry);
        }
    }
    catch (error) {
        console.error('로그인 처리 중 오류:', error);
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
memberRouter.post("/logout", async (req, res) => {
    let apiLogEntry = null;
    try {
        apiLogEntry = await Logger.logApiStart('POST /api/member/logout', []);
        // 1) 세션 제거 (express-session 기준)
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('세션 제거 오류:', err);
                }
            });
        }
        // 2) JWT 담긴 httpOnly 쿠키 삭제
        res.clearCookie('sessionID', {
            httpOnly: true,
            secure: false, // 운영환경: true + HTTPS
            sameSite: 'lax',
            path: '/', // 생성할 때와 동일해야 함
        });
        // 3) 응답
        return res.json({
            success: true,
            message: '로그아웃 완료',
        });
        await Logger.logApiSuccess(apiLogEntry);
    }
    catch (error) {
        console.error('로그아웃 처리 중 오류:', error);
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
memberRouter.get('/me', async (req, res) => {
    let apiLogEntry = null;
    try {
        apiLogEntry = await Logger.logApiStart('GET /api/member/me', []);
        if (req.session.user) {
            res.json(req.session.user);
            await Logger.logApiSuccess(apiLogEntry);
        }
        else {
            await Logger.logApiError(apiLogEntry, "로그인 필요");
            res.status(401).json({ message: '로그인 필요' });
        }
    }
    catch (error) {
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({ message: '서버 오류' });
    }
    ;
});
memberRouter.get('/getMember', async (req, res) => {
    let apiLogEntry = null;
    try {
        const { mem_id } = req.query;
        if (!mem_id) {
            return res.status(400).json({
                success: false,
                error: '회원 ID가 필요합니다.'
            });
        }
        apiLogEntry = await Logger.logApiStart('GET /api/member/getMember', [mem_id]);
        const data = await getMember(mem_id);
        res.json({
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        });
        await Logger.logApiSuccess(apiLogEntry);
    }
    catch (error) {
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
memberRouter.get('/getMemberships', async (req, res) => {
    try {
        const data = await getMemberships();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});
memberRouter.post('/insertMember', async (req, res) => {
    let apiLogEntry = null;
    try {
        const { mem_name, mem_nickname, mem_password, mem_img, mem_pnumber, mem_email, mem_sex, mem_age, mes_id } = req.body;
        // 필수값 검증
        if (!mem_name || !mem_password || !mem_sex || !mes_id) {
            return res.status(400).json({
                success: false,
                error: '필수 정보(이름, 패스워드, 성별, 등급)가 누락되었습니다.'
            });
        }
        apiLogEntry = await Logger.logApiStart('POST /api/insertMember', [mem_name, mem_email]);
        // 서비스 호출을 위한 데이터 구성
        const memberData = {
            MEM_ID_VIEW: '', // 서비스 내부에서 생성 및 업데이트 예정
            MEM_NAME: mem_name,
            MEM_NICKNAME: mem_nickname ?? null,
            MEM_PASSWORD: mem_password,
            MEM_IMG: mem_img ?? null,
            MEM_PNUMBER: mem_pnumber ?? null,
            MEM_EMAIL: mem_email ?? null,
            MEM_SEX: mem_sex,
            MEM_AGE: Number(mem_age) || 0,
            MEM_POINT: 0,
            MEM_EXP_POINT: 0,
            MEM_LVL: 0,
            MES_ID: Number(mes_id)
        };
        const result = await insertMember(memberData);
        res.json({
            success: true,
            data: result, // { MEM_ID, MEM_ID_VIEW } 리턴
            timestamp: new Date().toISOString()
        });
        await Logger.logApiSuccess(apiLogEntry);
    }
    catch (error) {
        if (apiLogEntry)
            await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
export default memberRouter;
