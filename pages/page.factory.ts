import { Page } from '@playwright/test';
import LoginPage from './login.page';
import DashboardPage from './dashboard.page';
import PostPage from './post.page';
import AllPostsPage from './all-posts.page';
import CategoriesPage from './categories.page';

class PageFactory {
    private page: Page;
    public loginPage: LoginPage;
    public dashboardPage: DashboardPage;
    public postPage: PostPage;
    public allPostsPage: AllPostsPage;
    public categoriesPage: CategoriesPage;
    
    constructor(page: Page) {
        this.page = page;
        this.loginPage = new LoginPage(page);
        this.dashboardPage = new DashboardPage(page);
        this.postPage = new PostPage(page);
        this.allPostsPage = new AllPostsPage(page);
        this.categoriesPage = new CategoriesPage(page);
    }

    getPostPage(): PostPage {
        return this.postPage;
    }

    getAllPostsPage(): AllPostsPage {
        return this.allPostsPage;
    }

    getCategoriesPage(): CategoriesPage {
        return this.categoriesPage;
    }
}
export default PageFactory;