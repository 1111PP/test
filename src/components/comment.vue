<script  setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
// import { useRouter } from 'vue-router'
// import { useAudioStore } from '@/store/audio/index.js'
// import useUserData from '@/store/user/index.js'
// import { storeToRefs } from 'pinia'
// import { ElMessage } from 'element-plus'
// import { getComment, addComment, deleteComment, updateUpvoteComment, getUpvoteComment } from '@/api/comment/index.js'
import lpInfiniteScroll from './lpUI/lp-infiniteScroll/index.vue'
// import moment from "moment"
// import cloneDeep from 'lodash/cloneDeep'
// const userData = useUserData()
// const { userInfo, clearUserInfo, promiseArr, canLogout } = storeToRefs(userData)
// const audioStore = useAudioStore()
// const { currSongInfo, songCoverImg, currSongId } = storeToRefs(audioStore)
// const router = useRouter()
const userInfo = ref({})
const promiseArr = ref([])
const canLogout = ref(false)
// import { setUserStatus } from "@/api/comment/index.js"
const bannedUser = (id) => {
    setUserStatus({
        userId: userInfo.userId,
        targetId: id,
        targetUserStatus: 2
    }).then(r => {
        if (r.code === 200) {
            ElMessage({ type: 'success', message: 'ID为' + id + '的用户已被禁言', offset: 339 })
        } else {
            if (r.code === 201) {
                ElMessage({ type: 'warning', message: '无权禁言', offset: 339 })

            }
        }
    })
}

const userAvatar = ref(new URL('../../../public/avatar.jpg', import.meta.url))
const commentText = ref('')
const residualText = computed(() => {
    return 140 - commentText.value.trim().length
})

const mockComment = () => {
    return Array.from({ length: 10 }).map(i => {
        return {
            userId: 1,
            comment: 'comment',
            time: '2024-06-12',
            likecount: 1,
        }
    })
}
//🟥所有评论信息
const commentList = ref(mockComment())
//发送评论
const sendComment = async () => {
    if (userInfo.userStatus === 2) {
        ElMessage({ offset: 339, message: '当前处于禁言状态!', type: 'error' })
        commentText.value = ''
        return
    }
    if (residualText.value < 0) {
        ElMessage({
            message: '评论字数超过限制',
            type: 'warning',
            offset: 339,
        })
        return
    } else if (residualText.value >= 140) {
        ElMessage({
            message: '评论字数不能为空',
            type: 'warning',
            offset: 339,
        })
        return
    }
    // 🟥添加评论
    else {
        const formattedDate = moment().format('YYYY-MM-DD');
        const r = await addComment({ userId: userInfo.userId, comment: commentText.value, time: formattedDate, })
        if (r?.code == 200) {
            ElMessage({
                message: '评论成功',
                type: 'success',
                offset: 339,
            })
            // 重新获取评论
            await getCommentAPI()
            commentText.value = ''
        } else {
            ElMessage({
                message: '评论失败',
                type: 'error',
                offset: 339,
            })
            return
        }
    }
}
//删除评论
const delComment = async (id) => {
    const r = await deleteComment({ commentId: id })
    if (r?.code == 200) {
        ElMessage({
            message: '删除评论成功',
            type: 'success',
            offset: 339,
        })
        //重新获取评论
        await getCommentAPI()
    }
}

//模拟该用户当前歌曲点赞评论id
const commentStatusList = ref([])
let copyCommentStatusList = []
//点赞评论
const upvoteComment = (e, item) => {
    //🟥点赞图标的样式控制思路
    // svgUpvote用作点赞图标,自带鼠标hover图标变黑色效果
    // 当用户点赞后, 图标保持红色, 此时hover就不能再变黑色了, 于是给svg加上liked类名, 用来区分用户是否点赞 .icon:hover:not(.liked) path {fill: black;}
    const svgIcon = e.target.tagName === "path" ? e.target.parentNode : e.target
    const status = Array.from(svgIcon.classList).includes('liked')
    //该评论已经点赞
    if (status) {
        //取消点赞逻辑
        svgIcon.classList.remove('liked')
        //找到该条屏幕,目标元素
        const target = commentList.value.find(i => i.id === item.id)
        //状态设置为false,间接取消svg的class中的liked样式
        target.liked = false
        //点赞数-1
        target.likecount -= 1
        //删除已点赞评论id的数组中相应评论id
        const delIndex = commentStatusList.value.findIndex(i => i === item.id)
        commentStatusList.value.splice(delIndex, 1)
        // console.log(commentStatusList.value);
        // ✨后续需要上传歌曲id,用户id,点赞评论id的数组,保存到数据库
    } else {
        //添加点赞
        svgIcon.classList.add('liked')
        const target = commentList.value.find(i => i.id === item.id)
        target.liked = true
        target.likecount += 1
        commentStatusList.value.push(item.id)
    }
}

/**
 * 🟥重新获取评论区全部数据
 * 通常为更新评论界面的操作，引发重新获取更新后的数据：新增、删除、初始化
 * 1.获取评论
 * 2.渲染已点赞评论
 */
const getCommentAPI = async () => {
    // 1.获取评论请求
    const r = await getComment()
    if (r?.code == 200) {
        commentList.value = r.data.sort((a, b) => b.id - a.id)
        // 2.进一步获取评论的点赞信息
        const r1 = await getUpvoteComment({ songId: currSongId.value, userId: 0 })
        if (r1?.code == 200) {
            //处理评论与点赞信息
            commentStatusList.value = r1.data[0]?.like_list.split('-').map(i => Number(i))
            //深拷贝数据，用于最后更新点赞请求时做参数
            copyCommentStatusList = cloneDeep(commentStatusList.value)
            // 将 用户点赞的评论id数据 与 评论列表数据 关联起来
            commentStatusList.value.forEach((i) => {
                const r = commentList.value.find(item => item.id === i);
                if (r) r.liked = true
            })
        }
    }
}


const commentBox = ref()
const commentBoxHeight = ref()
onMounted(async () => {
    // 重新获取评论
    // await getCommentAPI()
    const observe = new ResizeObserver((entries) => {
        commentBoxHeight.value = entries[0].contentRect.height - 75
    })
    observe.observe(commentBox.value)
})

/**
 * 比较新旧点赞列表，找出新增的点赞评论id和删除的点赞评论id
 * @param {int[]} a1 
 * @param {int[]} a2 
 */
const differenceWith = (a1, a2) => {
    const addArr = []
    const delArr = []
    a2.forEach(i => { !a1.includes(i) && addArr.push(i) })
    a1.forEach(i => { !a2.includes(i) && delArr.push(i) })
    return { addArr, delArr }
}
/**
 * @组件销毁或退出登录时发送请求保存点赞消息
 */
const saveUpvoteComment = async () => {
    const { addArr, delArr } = differenceWith(copyCommentStatusList, commentStatusList.value)
    console.log(addArr, delArr);
    //更新点赞信息
    // 1.更新user_liked表中该用户 对歌曲点赞评论like_list数据
    // 2.更新user_comment表中likecount评论点赞数
    return updateUpvoteComment({
        songId: currSongId.value,
        userId: 0,
        likeList: commentStatusList.value,
        addArr,
        delArr,
    })
    // return r
}

//组件销毁前，将点赞信息统一发送请求
onBeforeUnmount(async () => {
    //避免与👇logout时的保存操作冲突
    if (userInfo.value.username !== '') await saveUpvoteComment()
})
watch(canLogout, async () => {
    if (canLogout.value === false) {
        console.log('watch执行');
        promiseArr.value.push(
            saveUpvoteComment()
        )
    }
})

</script>

<template>
    <!-- <VEmojiPicker /> -->
    <div class="container" ref='commentBox'>
        <lpInfiniteScroll v-if="commentList.length > 0" :listData="commentList" :outHeight="commentBoxHeight"
            :singlePushCount="5">
            <template #title>
                <div class="sendComment">
                    <div class="title" :data-commentCount="commentList.length">全部评论</div>
                    <div class="inputBox">
                        <textarea v-model="commentText" placeholder="说点什么吧" class="rich-textbox"></textarea>
                        <div class="control">
                            <div class="wordCount" :style="{ color: residualText >= 0 ? 'gray' : 'red' }">{{
                                residualText }}</div>
                            <div class="control-right">
                                <div>#</div>
                                <div>@</div>
                                <div>🙂</div>
                                <div class="gap" style="color: rgb(210, 210, 210); margin-top: 2px;">|</div>
                                <div class="send" @click="sendComment">发布</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="commentList">
                    <div class="title">精彩评论</div>
                </div>
            </template>
            <template #default="{ item }">
                <div class="list-item">
                    <div class="userInfo">
                        <div class="avatar">
                            <img :src="userAvatar" alt="">
                        </div>
                        <div class="userInfo-right">
                            <div class="userName">用户id:{{ item.userId }}</div>
                            <div class="userComment">
                                {{ item.comment }}
                            </div>
                            <div class="otherInfo">
                                <div class="time">{{ item.time }}</div>
                                <div class="action">
                                    <el-popconfirm @confirm="bannedUser(item.userId)" :hide-after="0" title="确定禁言?">
                                        <template #reference>
                                            <div v-show="userInfo.userStatus == 0" class="banned"
                                                style="margin-right: 5px;">
                                                禁言</div>
                                        </template>
                                    </el-popconfirm>

                                    <el-popconfirm @confirm="delComment(item.id)" :hide-after="0" title="确定删除?">
                                        <template #reference>
                                            <!-- <div v-has="userInfo.userStatus" class="del">删除</div> -->
                                        </template>
                                    </el-popconfirm>
                                    <div class="like" :data-likeCount="item.likecount">
                                        <!-- 🟥点赞图标:
                                            1.控制图标变成红色
                                            2.图标使用class='liked'标记,控制样式
                                        -->
                                        <!-- <svgUpvote :class="item.liked ? 'liked' : ''" @click="upvoteComment($event, item)" -->
                                        <!-- class="icon" :color="item.liked ? 'red' : 'gray'" /> -->

                                        <!-- 点赞统计数字 = 0不显示,是点赞评论变成红色 -->
                                        <div v-show="item.likecount !== 0" :style="{ color: item.liked ? 'red' : 'gray', }"
                                            class="likecount">
                                            {{
                                                item.likecount
                                            }}</div>
                                    </div>
                                    <div class="share">分享</div>
                                    <div class="reply">回复</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </lpInfiniteScroll>
    </div>
</template>

<style scoped lang='scss'>
.liked {
    // color: red;
}

.container {
    //所有评论都需要容纳下,高度很高
    height: 100%;

    background-color: #F7F9FC;

    .top {
        width: 100%;
        display: flex;
        margin-bottom: 25px;

        .cover {
            height: 70px;
            width: 70px;

            img {
                height: 100%;
                width: 100%;
                border-radius: 15px;
            }
        }

        .songInfo {
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin-left: 15px;

            .title {
                font-size: 18px;
                margin-bottom: 10px;
                font-weight: 600;


            }

            .otherInfo {
                font-size: 12px;
                color: gray;
            }

        }
    }

    .sendComment {
        //粘性定位,top-50是为了让文字被遮盖,相当于多覆盖一段距离,让输入框被粘在container最顶部
        position: sticky;
        top: -30px;
        height: 150px;
        width: 100%;
        margin-bottom: 10px;
        background-color: #F7F9FC;

        z-index: 99;

        .title {
            position: relative;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 10px;

            &::before {
                content: attr(data-commentCount);
                position: absolute;
                top: 2px;
                left: 74px;
                font-size: 12px;
            }
        }

        .inputBox {
            width: 99%;
            height: 100px;
            overflow: hidden;
            border: 1px solid #ccc;
            border-radius: 10px;
            background-color: #F0F3F6;

            .rich-textbox {
                position: relative;
                width: 100%;
                height: 68%;
                box-sizing: border-box;
                background-color: #F0F3F6;
                font-size: 16px;
                border: none;
                font-size: 13px;
                padding-left: 18px;
                padding-top: 18px;
                resize: none;
            }

            .control {
                display: flex;
                justify-content: space-between;
                width: 97%;
                margin-left: 20px;

                .wordCount {
                    margin-top: 6px;
                    font-size: 10px;
                    color: gray;
                }

                .control-right {
                    display: flex;
                    align-items: center;
                    font-size: 16px;
                    color: gray;
                    margin-top: -5px;

                    div:hover {
                        color: black;
                        cursor: pointer;

                    }

                    div:nth-child(1) {
                        margin-top: 4px;
                        font-size: 18px;
                    }

                    div {
                        margin-right: 10px;
                    }

                    .send {
                        margin-top: 2px;
                    }
                }
            }

        }

    }



    .title {
        font-size: 18px;
        font-weight: 700;

    }


    .list-item {
        display: flex;
        flex-flow: column;
        border-bottom: 1px solid rgba(202, 202, 202, 0.452);
        width: 100%;
        overflow-wrap: break-word;



        .userInfo {
            display: flex;
            margin-top: 18px;
            width: 100%;

            .avatar {
                margin-right: 10px;

                img {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                }
            }

            .userInfo-right {
                width: 100%;

                &:hover .otherInfo .action .del {
                    opacity: 1;
                }

                .userName {
                    color: #5975B2;
                    font-size: 16px;
                    margin-bottom: 3px;
                }

                .userComment {
                    width: 100%;
                    overflow-wrap: break-word;
                    font-size: 15px;
                }

                .otherInfo {
                    display: flex;
                    justify-content: space-between;
                    height: 30px;
                    width: 98%;
                    margin-top: 15px;

                    .time {
                        font-size: 11px;
                        color: rgb(163, 163, 163);
                    }

                    .action {
                        display: flex;
                        font-size: 12px;
                        color: rgb(163, 163, 163);



                        .like {
                            position: relative;
                            display: flex;
                            // background-color: gray;

                            .likecount {
                                position: absolute;
                                left: -50px;
                                top: 1px;
                                width: 35px;
                                text-align: right;
                                // background-color: gray;
                            }
                        }

                        .del {
                            opacity: 0;
                            margin-right: 30px;
                        }

                        div:hover:not(.liked) {
                            color: black;
                            cursor: pointer
                        }

                        div {
                            margin-left: 10px;
                        }

                    }
                }
            }
        }

        .commentList {
            width: 100%;
        }


    }
}
</style>