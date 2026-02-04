<script>
export default {
  globalData: {
    // 首页用这个来决定是否显示隐私弹窗
    needPrivacyPopup: false
  },
 
  onLaunch() {
    // 仅用于测试，跑通后可删
    const oldUid = uni.getStorageSync('cloud_uid') || '';
    let token = uni.getStorageSync('cloud_token') || '';
  
    const ensureLogin = () => {
      if (token) return Promise.resolve(token);
  
      return uniCloud.callFunction({
        name: 'auth_anonymous',
        data: { uid: oldUid }
      }).then(r => {
        const d = r.result && r.result.data;
        if (!d || !d.token) throw new Error('auth_anonymous 没拿到 token');
  
        uni.setStorageSync('cloud_uid', d.uid);
        uni.setStorageSync('cloud_token', d.token);
        token = d.token;
        return token;
      });
    };
  
    ensureLogin()
      .then((tk) => {
        // 1) 先写入一条测试数据
        return uniCloud.callFunction({
          name: 'importantDate_add',
          data: {
            token: tk,
            title: '测试：我们在一起',
            date: '2026-01-01',
            type: '纪念日'
          }
        }).then(() => tk);
      })
      .then((tk) => {
        // 2) 再查询列表
        return uniCloud.callFunction({
          name: 'importantDate_list',
          data: { limit: 5, token: tk }
        });
      })
      .then(res => {
        console.log('写入+查询成功：', JSON.stringify(res));
      })
      .catch(err => {
        console.error('云端测试失败：', err);
      });
  
    // 下面继续保留你原来的 onLaunch 逻辑（logs、隐私弹窗等）
	// 正文部分
	// 1) 保留你原来的 logs 逻辑
	const logs = uni.getStorageSync('logs') || [];
	logs.unshift(Date.now());
	uni.setStorageSync('logs', logs);
	
	// 2) 首次启动隐私协议判断
	const KEY = 'privacy_agreed_v1';
	const agreed = !!uni.getStorageSync(KEY);
	
	// 用 globalData 传给首页
	this.globalData.needPrivacyPopup = !agreed;
	
	// （可选）也写一份到 storage，方便你调试或多页面读取
	// uni.setStorageSync('__need_privacy_popup', !agreed);
	
	// 3) 删除登录逻辑：uni.login（按你要求）
  }

};
</script>

<style>
@import './app.css';
</style>
