import React, { useState, useEffect } from "react";

import { useSearchParams } from "react-router-dom";
import useStorage from "../hooks/useStorage";

import useCachedMultipart from "../hooks/useCachedMultipart";
import { useDebounce } from "@uidotdev/usehooks";

import Typography from "@mui/joy/Typography";
import Container from "@mui/joy/Container";
import Select, { selectClasses } from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Input from "@mui/joy/Input";
import Box from "@mui/joy/Box";

import ButtonGroup from "@mui/joy/ButtonGroup";
import IconButton from "@mui/joy/IconButton";

import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import SortIcon from "@mui/icons-material/Sort";
import SearchIcon from "@mui/icons-material/Search";
import ViewCompactIcon from "@mui/icons-material/ViewCompact";
import ViewListIcon from "@mui/icons-material/ViewList";

import { LinearValueLoader, PageError, SimpleNumberFormat } from "../components/Shared/Display";
import TriStateCheckbox from "../components/Shared/TriStateCheckbox";

// import MBinGrid from "../components/GridView/MBin";
// import MBinList from "../components/ListView/MBin";

import PiefedGrid from "../components/GridView/Piefed";
import PiefedList from "../components/ListView/Piefed";

// import { IMBinMagazineOutput } from "../../../types/output";
import { IPiefedCommunityDataOutput } from "../../../types/output";

function PiefedCommunities() {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    isLoading,
    loadingPercent,
    isSuccess,
    isError,
    error,
    data: tyhisDatya,
  } = useCachedMultipart("piefedCommunitiesData", "piefed_communities");

  const piefedCommunityData: IPiefedCommunityDataOutput[] = tyhisDatya;

  const [viewType, setViewType] = useStorage("piefed.viewType", "grid");

  const [orderBy, setOrderBy] = React.useState("subscriptions");
  const [showNSFW, setShowNSFW] = React.useState(false);

  // debounce the filter text input
  const [filterText, setFilterText] = React.useState("");
  const debounceFilterText = useDebounce(filterText, 500);

  // load query params
  useEffect(() => {
    if (searchParams.has("query")) setFilterText(searchParams.get("query"));
    if (searchParams.has("order")) setOrderBy(searchParams.get("order"));
    if (searchParams.has("nsfw"))
      setShowNSFW(
        searchParams.get("nsfw") == "true" ? true : searchParams.get("nsfw") == "null" ? null : false,
      );
  }, []);

  // update query params
  useEffect(() => {
    const parms: any = {};

    if (filterText) parms.query = filterText;
    if (orderBy != "smart") parms.order = orderBy;
    if (showNSFW != false) parms.nsfw = showNSFW;

    setSearchParams(parms);
  }, [orderBy, showNSFW, filterText]);

  // this applies the filtering and sorting to the data loaded from .json
  const piefedCommunitiesData = React.useMemo(() => {
    if (isError) return [];
    if (!piefedCommunityData) return [];

    console.time("sort+filter piefed communities");
    console.log(`Loaded ${piefedCommunityData.length} piefed communities`);

    let communties = [...piefedCommunityData];

    console.log(`Sorting piefed communities by ${orderBy}`);

    // Variable "ShowNSFW" is used to drive this
    //  Default:    Hide NSFW     false
    if (showNSFW == false) {
      console.log(`Hiding nsfw piefed communities`);
      communties = communties.filter((community) => {
        return !community.nsfw;
      });
    }

    //  One Click:  Include NSFW  null
    else if (showNSFW == null) {
      console.log(`Including nsfw piefed communities`);
    }

    //  Two Clicks: NSFW Only     true
    else if (showNSFW == true) {
      console.log(`Showing NSFW piefed communities`);
      communties = communties.filter((community) => {
        return community.nsfw;
      });
    }

    // filter string
    if (debounceFilterText) {
      console.log(`Filtering piefed communities by ${debounceFilterText}`);

      // split the value on spaces, look for values starting with "-"
      // if found, remove the "-" and add to the exclude list
      // if not found, apend to the search query
      let exclude = [];
      let include = [];

      let searchTerms = debounceFilterText.toLowerCase().split(" ");
      searchTerms.forEach((term) => {
        if (term.startsWith("-") && term.substring(1) !== "") {
          exclude.push(term.substring(1));
        } else if (term !== "") {
          include.push(term);
        }
      });
      console.log(`Include: ${include.join(", ")}`);
      console.log(`Exclude: ${exclude.join(", ")}`);

      // search for any included terms
      if (include.length > 0) {
        console.log(`Searching for ${include.length} terms`);
        include.forEach((term) => {
          communties = communties.filter((community) => {
            return (
              (community.name && community.name.toLowerCase().includes(term)) ||
              (community.title && community.title.toLowerCase().includes(term)) ||
              (community.baseurl && community.baseurl.toLowerCase().includes(term)) ||
              (community.description && community.description.toLowerCase().includes(term))
            );
          });
        });
      }

      // filter out every excluded term
      if (exclude.length > 0) {
        console.log(`Filtering out ${exclude.length} terms`);
        exclude.forEach((term) => {
          communties = communties.filter((community) => {
            return !(
              (community.name && community.name.toLowerCase().includes(term)) ||
              (community.title && community.title.toLowerCase().includes(term)) ||
              (community.baseurl && community.baseurl.toLowerCase().includes(term)) ||
              (community.description && community.description.toLowerCase().includes(term))
            );
          });
        });
      }
    }
    console.log(`Filtered ${communties.length} magazines`);

    // sorting
    if (orderBy === "subscriptions") {
      communties = communties.sort((a, b) => b.subscriptions_count - a.subscriptions_count);
    } else if (orderBy === "posts") {
      communties = communties.sort((a, b) => b.post_count - a.post_count);
    } else if (orderBy === "name") {
      communties = communties.sort((a, b) => a.name.localeCompare(b.name));
    }

    console.log(`Sorted ${communties.length} piefed communities`);

    console.log(
      `updating piefed communities data with ${communties.length} communities, removed: ${
        piefedCommunityData.length - communties.length
      }`,
    );

    console.timeEnd("sort+filter piefed communities");

    // return a clone so that it triggers a re-render  on sort
    return [...communties];
  }, [piefedCommunityData]);

  return (
    <Container
      maxWidth={false}
      style={{
        paddingRight: "16px",
        paddingLeft: "16px",
      }}
    >
      <Box
        component="header"
        sx={{
          p: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Input
          startDecorator={<SearchIcon />}
          placeholder="Filter Communities"
          value={filterText}
          sx={{
            width: { xs: "100%", sm: 285 },
            flexShrink: 0,
          }}
          onChange={(event) => setFilterText(event.target.value)}
        />

        <Select
          placeholder="Order By"
          startDecorator={<SortIcon />}
          indicator={<KeyboardArrowDown />}
          value={orderBy}
          onChange={(event, newValue) => {
            setOrderBy(newValue);
          }}
          sx={{
            minWidth: 120,
            width: { xs: "100%", sm: 240 },
            flexShrink: 0,
            flexGrow: 0,
            [`& .${selectClasses.indicator}`]: {
              transition: "0.2s",
              [`&.${selectClasses.expanded}`]: {
                transform: "rotate(-180deg)",
              },
            },
          }}
        >
          {/* <Option value="smart">Smart Sort</Option> */}
          <Option value="subscriptions">Subscriptions</Option>
          <Option value="posts">Posts</Option>
          <Option value="name">Name</Option>
        </Select>

        <Box sx={{ display: "flex", gap: 3 }}>
          <TriStateCheckbox checked={showNSFW} onChange={(checked) => setShowNSFW(checked)} />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {isSuccess && (
            <Typography
              level="body2"
              sx={{
                borderRadius: "4px",
                mr: 2,
              }}
            >
              showing{" "}
              <SimpleNumberFormat
                value={piefedCommunitiesData.length}
                // displayType={"text"}
                // decimalScale={2}
                // thousandSeparator={","}
              />{" "}
              communities
            </Typography>
          )}

          <ButtonGroup
            sx={{
              "--ButtonGroup-radius": "8px",
              "--ButtonGroup-separatorSize": "0px",
              "--ButtonGroup-connected": "0",
              "--joy-palette-neutral-plainHoverBg": "transparent",
              "--joy-palette-neutral-plainActiveBg": "transparent",
              "&:hover": {
                boxShadow: "inset 0px 0px 0px 1px var(--joy-palette-neutral-softBg)",
                "--ButtonGroup-connected": "1",
              },
            }}
          >
            <IconButton
              variant={viewType == "grid" ? "solid" : "soft"}
              color={viewType == "grid" ? "warning" : "neutral"}
              onClick={() => setViewType("grid")}
              sx={{
                p: 1,
                borderRadius: "8px 0 0 8px",
              }}
            >
              <ViewCompactIcon /> Grid View
            </IconButton>
            <IconButton
              variant={viewType == "list" ? "solid" : "soft"}
              color={viewType == "list" ? "warning" : "neutral"}
              onClick={() => setViewType("list")}
              sx={{
                p: 1,
                borderRadius: "0 8px 8px 0",
              }}
            >
              <ViewListIcon /> List View
            </IconButton>
          </ButtonGroup>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        {isLoading && !isError && <LinearValueLoader progress={loadingPercent} />}
        {isError && <PageError error={error} />}

        {isSuccess && viewType == "grid" && <PiefedGrid items={piefedCommunitiesData} />}
        {isSuccess && viewType == "list" && <PiefedList items={piefedCommunitiesData} />}
      </Box>
    </Container>
  );
}
export default React.memo(PiefedCommunities);
