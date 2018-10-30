package cz.zcu.kiv.imiger.tests.frontend;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class SeleniumUtil {

    private static final String TEST_DIRECTORY = System.getProperty("user.dir") + "\\..\\test";

    /**
     * Path to the config location folder
     * Path should be the same as in web.xml file
     * Please change to your location
     */
    private static final String APP_CONFIG_LOCATION = "C:\\Users\\Tomas\\Sources\\swi\\IMiGEr\\config";

    private static final String GECKO_PATH = TEST_DIRECTORY + "\\geckodriver.exe";

    private static final String URL = "http://localhost:8080";

    private static final int DATA_LOAD_TIMEOUT = 20;

    private static WebDriver browser;

    public static WebDriver init() {
        System.setProperty("webdriver.gecko.driver", GECKO_PATH);
        browser = new FirefoxDriver();
        browser.get(URL);
        return browser;
    }

    public static void loadGraphData(String filename) {
        WebElement fileInput = browser.findElement(By.id("hidden_input"));
        fileInput.sendKeys(TEST_DIRECTORY + "\\data\\" + filename );
        browser.findElement(By.className("load")).click();

        WebDriverWait wait = new WebDriverWait(browser, DATA_LOAD_TIMEOUT);
        wait.until(ExpectedConditions.presenceOfElementLocated(By.className("vertices")));

        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static void prepareConfigFile(String configFile) {
        try {
            Files.deleteIfExists(Paths.get(APP_CONFIG_LOCATION + "\\config.json"));
            Files.createLink(Paths.get(APP_CONFIG_LOCATION + "\\config.json"),
                    Paths.get(TEST_DIRECTORY + "\\config\\" + configFile));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void svgClick(WebElement toClick) {
        Actions builder = new Actions(browser);
        builder.click(toClick).build().perform();

        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    /**
     * Right mouse click
     * @param toClick element for click
     */
    public static void svgContexClick(WebElement toClick) {
        Actions builder = new Actions(browser);
        builder.contextClick(toClick).build().perform();

        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static void clear() {
        browser.close();
    }
}