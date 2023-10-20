import React, { useEffect, useRef } from 'react';
import { createRoot } from "react-dom/client";
import { ListItemButton, ListItemIcon, Divider, ListItemText, Paper, ThemeProvider, Grid } from "@mui/material";

interface Context {
    user: {
        userGroups: string[];
    };
    theme: any;
}

const styles = `
.hide {
    display: none;
}
`;

function processUserGroups(userGroups: string[]): string[] {
    if (!Array.isArray(userGroups)) {
        return [];
    }
    
    let optionsUserGroups = userGroups.filter(x => !(x.includes(".Base") || x.includes(".Role")));

    if (optionsUserGroups.includes("CH.Consumer.RCPS")) {
        optionsUserGroups = optionsUserGroups.filter(value => value !== "DML.Consumer.Base");
    }

    const userGroupsMapped = optionsUserGroups.map(value => {
        const newValue = value.replace(/ch|CH\./g, "");
        return newValue ? newValue.replace(".", " ") : value;
    });

    const updatedUserGroupsArray = userGroupsMapped.filter(value => !/Everyone|TermsAndConditions/.test(value));

    const uniqueUserGroups = [...new Set(updatedUserGroupsArray)];
    return uniqueUserGroups.map(value => {
        const newValue = value.replace(/Base|Role/g, "");
        return newValue ? newValue.replace(".", " ") : value;
    });
}
function attachMenuListeners(profileLink: Element, showMenu: EventListener, hideMenuImmediately: EventListener) {
    profileLink.addEventListener('mouseenter', showMenu);
    profileLink.addEventListener('click', hideMenuImmediately);
}


function createDropdownMenu() {
    const newDropdownMenu = document.createElement('div');
    newDropdownMenu.id = "profile-groups-menu";
    newDropdownMenu.className = "hide dropdown-menu dropdown-menu-right";
    document.body.appendChild(newDropdownMenu);
    return newDropdownMenu;
}

function appendUserGroupsToMenu(dropdownMenu: HTMLElement, userGroups: string[]) {
    userGroups.forEach(group => {
        const anchor = document.createElement('a');
        anchor.className = "ch-dropdownLink";
        anchor.href = "#";
        anchor.style.textDecoration = 'none';
        anchor.style.color = 'inherit';
        anchor.style.display = 'block';
        anchor.style.padding = '8px 15px';
        anchor.onmouseover = () => { anchor.style.backgroundColor = '#f5f5f5'; };
        anchor.onmouseout = () => { anchor.style.backgroundColor = ''; };
        anchor.innerHTML = `<li class="m-icon m-icon-people ch-dropdownLink" style="margin-left:5px; margin-right:20px;"></li>${group}`;
        dropdownMenu.appendChild(anchor);
    });
}

function InjectUserGroups({ context }: { context: Context }) {
    const injected = useRef(false);
    const finalUserGroups = useRef<string[]>([]);
    let hideTimer: any = null;

    useEffect(() => {
        if (window.location.href.includes('admin') || injected.current) {
            return;
        }

        finalUserGroups.current = processUserGroups(context.user.userGroups);

        const showMenu: EventListener = (event) => {
            const dropdownMenu = document.getElementById('profile-groups-menu');
            dropdownMenu?.classList.remove('hide');
            if (hideTimer) clearTimeout(hideTimer);
        };
        
        const hideMenuImmediately: EventListener = (event) => {
            const dropdownMenu = document.getElementById('profile-groups-menu');
            if (hideTimer) clearTimeout(hideTimer);
            dropdownMenu?.classList.add('hide');
        };

        function hideMenuWithDelay() {
            const dropdownMenu = document.getElementById('profile-groups-menu');
            hideTimer = setTimeout(() => {
                dropdownMenu?.classList.add('hide');
            }, 100);
        }

        function hideMenuIfOutside(e: MouseEvent) {
            const dropdownMenu = document.getElementById('profile-groups-menu');
            const profileLink = document.querySelector('a[title*="Profile and settings"]');
            if (!dropdownMenu!.contains(e.target as Node) && !profileLink!.contains(e.target as Node)) {
                hideMenuWithDelay();
            }
        }

        document.addEventListener('mouseover', hideMenuIfOutside);

        const profileLink = document.querySelector('a[title*="Profile and settings"]');
        const dropdownMenu = document.getElementById('profile-groups-menu')?? createDropdownMenu();

        if (profileLink) {
            attachMenuListeners(profileLink, showMenu, hideMenuImmediately);
        }

        appendUserGroupsToMenu(dropdownMenu, finalUserGroups.current);

        injected.current = true;

        return () => {
            document.removeEventListener('mouseover', hideMenuIfOutside);
            if (profileLink) {
                profileLink.removeEventListener('mouseenter', showMenu);
                profileLink.removeEventListener('click', hideMenuImmediately);
            }
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, [context]);

    if (window.location.href.includes('admin')) {
        return null;
    }

    return (
        <ThemeProvider theme={context.theme}>
            <Paper variant="outlined" sx={{ position: 'fixed', top: '3.5em', right: '1em', zIndex: 13000, minWidth: '238px', minHeight: '200px', maxHeight: '800px' }} id="profile-groups-menu" className="hide">
                <Grid container direction="column">
                    <Grid item>
                        <ListItemButton>
                            <ListItemIcon>
                                <i className="m-icon m-icon-user-circle" style={{minWidth:'45px !important', marginRight: '20px'}}></i>
                                <ListItemText primary="Group memberships"/>
                            </ListItemIcon>
                        </ListItemButton>
                    </Grid>
                    <Divider />
                    {finalUserGroups.current.map(group => (
                        <Grid item key={group}>
                            <ListItemButton>
                                <ListItemIcon>
                                    <i className="m-icon m-icon-people" style={{ marginRight: '20px' }}></i>
                                </ListItemIcon>
                                <ListItemText primary={group} /><br/>
                            </ListItemButton>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </ThemeProvider>
    );
}

export default function createExternalRoot(container: HTMLElement) {
    let root = createRoot(container);

    return {
        render(context: Context) {
            root.render(<InjectUserGroups context={context} />);
        },
        unmount() {
            root.unmount();
        },
    };
}
