import Vue from 'vue';
import VueRouter from 'vue-router';
import Teacher from "@/Teacher";
import Student from "@/Student";

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Teacher',
        component: Teacher
    },
    {
        path: '/student',
        name: 'Student',
        component: Student
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title
    }

    next();
});

export default router;
