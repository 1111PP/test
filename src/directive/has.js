import { ElMessage } from 'element-plus'
export default function vHas(app) {
  const userData = useUserData()
  app.directive('has', (el, binging) => {
    //删除按钮权限
    if (
      [...el.classList].includes('del') &&
      userData.userInfo.userStatus !== 0
    ) {
      // console.log('删除按钮权限')
      el.parentNode?.removeChild(el)
    }
  })
}
